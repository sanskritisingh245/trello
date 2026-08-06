import { WebSocket, WebSocketServer} from "ws";
import type { RawData } from "ws";
import jwt from "jsonwebtoken";
import { prisma } from "../../packages/db";

const JWT_SECRET: string = (() => {
    const secret = process.env.JWT_SECRET;
    if (!secret) {
        throw new Error("JWT_SECRET environment variable is not set");
    }
    return secret;
})();

type Payload = {
  id: string;
  email: string;
};

const WS_PORT = process.env.WS_PORT ? Number(process.env.WS_PORT) : 8080;

interface Issue {
    id:string,
    title:string,
    section:string
}

class WsManager {
  private static instance: WsManager;

  private wss: WebSocketServer;

  private boards: Record<
    string,
    {
      id: string;
      profile: string;
      socket: WebSocket;
    }[]
  > = {};

  // Keeps track of which board each socket joined
  private joinedRooms = new Map<WebSocket, string>();

  private constructor() {
    this.wss = new WebSocketServer({
      port: WS_PORT,
    });

    this.initialize();
  }

  public static getInstance(): WsManager {
    if (!WsManager.instance) {
      WsManager.instance = new WsManager();
    }

    return WsManager.instance;
  }

  private initialize() {
    this.wss.on("connection", (socket, req) => {
      const query = req.url?.split("?")[1] ?? "";
      const token = new URLSearchParams(query).get("token");

      if (!token) {
        socket.close();
        return;
      }

      let payload: Payload;

      try {
        payload = jwt.verify(token, JWT_SECRET) as Payload;
      } catch {
        socket.close();
        return;
      }

      socket.on("message", async (data) => {
        await this.handleMessage(data, payload, socket);
      });

      socket.on("close", () => {
        this.handleDisconnect(socket);
      });
    });
  }

  private async handleMessage(
        data: RawData,
        payload: Payload,
        socket: WebSocket
    ){
        try{
            let parsedData;
            try {
            parsedData = JSON.parse(data.toString());
            } catch {
            return;
            }
    
            const user = await prisma.user.findUnique({
            where: {
                id: payload.id,
            },
            });
    
            const profilePhoto = user?.profilePhoto;
    
            if (!profilePhoto) {
            socket.close();
            return;
            }
    
            if (parsedData.type === "join") {
            const boardId = parsedData.boardId;
            const board = await prisma.boards.findFirst({
                where:{
                    id:boardId,
                    organization:{
                        membership:{
                            some:{
                                userId:payload.id
                            },
                        },
                    },
                },
            });
    
            if (!board) {
                socket.close();
                return;
            }
    
            const previousBoardId= this.joinedRooms.get(socket);
            if(previousBoardId && previousBoardId !== boardId && this.boards[previousBoardId]){
                this.boards[previousBoardId] = this.boards[previousBoardId].filter(
                    (member) => member.socket !== socket
                );
    
                if(this.boards[previousBoardId].length === 0){
                    delete this.boards[previousBoardId]
                }
            }
           this.joinedRooms.set(socket, boardId);
        
    
          if (!this.boards[boardId]) {
            this.boards[boardId] = [];
          }
    
          this.boards[boardId].forEach(({ socket }) => {
            socket.send(
              JSON.stringify({
                type: "join",
                profile: profilePhoto,
              })
            );
          });
    
          this.boards[boardId].push({
            id: payload.id,
            profile: profilePhoto,
            socket,
          });
    
          socket.send(
            JSON.stringify({
              type: "initial_state",
              users: this.boards[boardId]
                .filter((user) => user.id !== payload.id)
                .map((user) => user.id),
            })
          );
        }
        else if(parsedData.type === "issue_moved"){
        const boardId= this.joinedRooms.get(socket);
        if(!boardId){
            return;
        }
        
        if(!this.boards[boardId]){
            return;
        }

        this.boards[boardId].filter((member)=>member.socket !== socket).forEach((member)=>{
            member.socket.send(
                JSON.stringify({
                    type: "issue_moved",
                    issueId: parsedData.issueId,
                    sectionId: parsedData.sectionId,
                })
            );
        });
    }
    } catch (error) {
        console.error("Failed to handle message:", error);
    }
  }

  private handleDisconnect(socket: WebSocket) {
    const joinedRoom = this.joinedRooms.get(socket);

    if (!joinedRoom) {
      return;
    }

    if (!this.boards[joinedRoom]) {
      return;
    }

    this.boards[joinedRoom] = this.boards[joinedRoom].filter(
      (user) => user.socket !== socket
    );

    if (this.boards[joinedRoom].length === 0) {
      delete this.boards[joinedRoom];
    }

    this.joinedRooms.delete(socket);
  }
}

WsManager.getInstance();