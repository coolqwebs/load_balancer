import express from "express";
import httpProxy from "http-proxy";

interface WeightedServer {
  server: string;
  weight: number;
}

const servers: WeightedServer[] = [
  {
    server: "http://localhost:3000",
    weight: 1,
  },
  {
    server: "http://localhost:8080",
    weight: 2,
  },
  {
    server: "http://localhost:4000",
    weight: 4,
  },
  {
    server: "http://localhost:5000",
    weight: 8,
  },
];

class RoundRobinBalancer {
  private servers: WeightedServer[];
  private index: number;
  private proxy: httpProxy;
  private weights: number[];

  constructor(servers: WeightedServer[]) {
    this.servers = servers;
    this.index = -1;
    this.weights = servers.map((s) => s.weight);
    this.proxy = httpProxy.createProxyServer();
  }

  public getServer(): string {
    let maxWeight: number = 0;
    let candidate: string | null = null;

    for (let i = 0; i < this.servers.length; i++) {
      this.servers[i].weight--;

      if (this.servers[i].weight <= 0) {
        this.servers[i].weight = this.weights[i];
        if (this.servers[i].weight > maxWeight) {
          maxWeight = this.servers[i].weight;
          candidate = this.servers[i].server;
        }
      } else if (this.servers[i].weight > maxWeight) {
        maxWeight = this.servers[i].weight;
        candidate = this.servers[i].server;
      }
    }
    return candidate as string;
  }

  public handleRequest(req: express.Request, res: express.Response): void {
    const target = this.getServer();
    console.log(target);
    this.proxy.web(req, res, { target });
  }
}

const balancer = new RoundRobinBalancer(servers);

const app = express();
app.all("*", balancer.handleRequest.bind(balancer));
app.listen("3333");
