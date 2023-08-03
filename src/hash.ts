import express from "express";
import httpProxy from "http-proxy";
import * as crypto from "crypto";
const servers: string[] = [
  "http://localhost:3000",
  "http://localhost:8080",
  "http://localhost:4000",
  "http://localhost:5000",
];

class RoundRobinBalancer {
  private servers: string[];
  private proxy: httpProxy;

  constructor(servers: string[]) {
    this.servers = servers;
    this.proxy = httpProxy.createProxyServer();
  }

  private hashIp(ip: string): number {
    const hash = crypto.createHash("md5").update(ip).digest("hex");
    const maxsafeInt = BigInt(Number.MAX_SAFE_INTEGER);

    let result = BigInt(0);

    for (let i = 0; i < hash.length; i += 2) {
      const hexValue = BigInt(parseInt(hash.slice(i, i + 2), 16));
      result += hexValue;
    }
    return Number(result % maxsafeInt);
  }

  public getServer(ip: string): string {
    const hashedIp = this.hashIp(ip);
    console.log("🚀 ~ hashedIp:", hashedIp);
    const index = hashedIp % this.servers.length;
    console.log("🚀 ~ index:", index);
    return this.servers[index];
  }

  public handleRequest(req: express.Request, res: express.Response): void {
    const clientIp = req.headers["ip"] as string;
    const target = this.getServer(clientIp);
    console.log("🚀 ~ target:", target);
    this.proxy.web(req, res, { target });
  }
}

const balancer = new RoundRobinBalancer(servers);

const app = express();
app.all("*", balancer.handleRequest.bind(balancer));
app.listen("3333");
