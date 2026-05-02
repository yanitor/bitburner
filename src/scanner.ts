import { NS } from '@ns';
import type { ServerInfo, ServerScore } from '@/lib/types';
import { getServerInfo, calcScore } from '@/lib/utils';

export function discoverServers(ns: NS): string[] {
  const visited = new Set<string>(['home']);
  const queue: string[] = ['home'];

  while (queue.length > 0) {
    const current = queue.shift();
    if (!current) continue;

    const neighbors = ns.scan(current);
    neighbors.forEach((n) => {
      if (!visited.has(n)) {
        visited.add(n);
        queue.push(n);
      }
    });
  }

  return [...visited];
}

function filterHackable(ns: NS, allServers: string[]): string[] {
  const result: string[] = [];
  const currentHackingLevel = ns.getHackingLevel();

  allServers.forEach((server) => {
    if (!ns.hasRootAccess(server)) return;
    if (ns.getServerRequiredHackingLevel(server) > currentHackingLevel) return;
    if (ns.getServerMaxMoney(server) === 0) return;

    result.push(server);
  });

  return result;
}

function scoreServers(ns: NS, hostnames: string[]): ServerScore[] {
  const result: ServerScore[] = [];

  hostnames.forEach((hostname) => {
    const info = getServerInfo(ns, hostname);
    const score = calcScore(info);
    const serverScore = { info, score };

    result.push(serverScore);
  });

  return result;
}

function sortByScore(servers: ServerScore[]): ServerScore[] {
  servers.sort((a, b) => b.score - a.score);
  return servers;
}

export function getBestTargets(ns: NS, topN = 5): ServerInfo[] {
  const discovered = discoverServers(ns);
  const filtered = filterHackable(ns, discovered);
  const scored = scoreServers(ns, filtered);
  const sorted = sortByScore(scored);

  const top = sorted.slice(0, topN);

  return top.map((s) => s.info);
}

export async function main(ns: NS): Promise<void> {
  const allServers = discoverServers(ns);
  const hackable = filterHackable(ns, allServers);
  const scored = scoreServers(ns, hackable);
  const sorted = sortByScore(scored);

  for (const s of sorted) {
    ns.tprint(`${s.info.hostname}→ Score: ${s.score.toFixed(2)}`);
  }
}
