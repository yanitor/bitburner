import { NS } from '@ns';
import type { ServerInfo } from '@/lib/types';

export const CONFIG = {
  // Worker-Scripts
  HACK_SCRIPT: '/workers/hack.ts',
  GROW_SCRIPT: '/workers/grow.ts',
  WEAKEN_SCRIPT: '/workers/weaken.ts',

  //Hack-Strategies
  HACK_PERCENT: 0.7,
  SECURITY_THRESHOLD: 5,
  MONEY_THRESHOLD: 0.9,

  //Timing
  SCHEDULER_INTERVAL: 2000,
  INIT_WATCHDOG_SLEEP: 10000,
};

export function calcScore(info: ServerInfo): number {
  if (info.maxMoney <= 0) return 0;
  if (info.minSecurity === 0) return 0;

  const maxMoney = info.maxMoney;
  const minSec = info.minSecurity;
  const currentSec = info.currentSecurity;
  const growth = info.growthRate;
  const extraSec = Math.max(0, currentSec - minSec);

  const secFactor = minSec * (1 + extraSec);
  const growthFactor = growth / 100;
  const moneyFactor = maxMoney / 1e6;

  return (moneyFactor * growthFactor) / secFactor;
}

export function calcThreads(availableRam: number, scriptRam: number): number {
  if (scriptRam === 0) return 0;
  return Math.floor(availableRam / scriptRam);
}

export function moneyPercent(info: ServerInfo): number {
  if (info.currentMoney === 0) return 0;
  return info.currentMoney / info.maxMoney;
}

export function freeRam(info: ServerInfo): number {
  return info.maxRam - info.usedRam;
}

export function formatMoney(amount: number): string {
  // TODO: logik für lesbare Zahlen
  return amount.toString();
}

export function formatRam(gb: number): string {
  // TODO: logik für lesbare Zahlen
  return `${gb}GB`;
}

export function getServerInfo(ns: NS, hostname: string): ServerInfo {
  return {
    hostname,
    maxMoney: ns.getServerMaxMoney(hostname),
    currentMoney: ns.getServerMoneyAvailable(hostname),
    minSecurity: ns.getServerMinSecurityLevel(hostname),
    currentSecurity: ns.getServerSecurityLevel(hostname),
    hackLevel: ns.getServerRequiredHackingLevel(hostname),
    growthRate: ns.getServerGrowth(hostname),
    hasRoot: ns.hasRootAccess(hostname),
    maxRam: ns.getServerMaxRam(hostname),
    usedRam: ns.getServerUsedRam(hostname),
  };
}
