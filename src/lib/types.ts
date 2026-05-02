export interface ServerInfo {
  hostname: string;
  maxMoney: number;
  currentMoney: number;
  minSecurity: number;
  currentSecurity: number;
  hackLevel: number;
  growthRate: number;
  hasRoot: boolean;
  maxRam: number;
  usedRam: number;
}

export interface ServerScore {
  info: ServerInfo;
  score: number;
}

export enum TaskType {
  HACK = 'hack',
  GROW = 'grow',
  WEAKEN = 'weaken',
}

export interface Task {
  taskType: TaskType;
  target: string;
  threads: number;
}
