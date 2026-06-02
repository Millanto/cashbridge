export interface FileNode {
  name: string;
  type: "file" | "directory";
  children?: FileNode[];
  description?: string;
}

export interface DbTableColumn {
  name: string;
  type: string;
  constraints?: string;
  description: string;
}

export interface DbTable {
  name: string;
  description: string;
  columns: DbTableColumn[];
  rlsPolicies: string[];
  ddl: string;
}

export interface ApiEndpoint {
  method: "GET" | "POST" | "PUT" | "DELETE" | "PATCH";
  route: string;
  description: string;
  requestBody?: string;
  responseBody: string;
  authRequired: boolean;
}

export interface RoadmapTask {
  id: string;
  title: string;
  description: string;
  estimatedTime: string;
  difficulty: "Low" | "Medium" | "High" | "Critical";
  status: "pending" | "completed";
}

export interface RoadmapPhase {
  phaseNumber: number;
  title: string;
  objective: string;
  tasks: RoadmapTask[];
}
