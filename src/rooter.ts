import { NS } from '@ns';
import { discoverServers } from '@/scanner';

export async function main(ns: NS): Promise<void> {
  const allServers = discoverServers(ns);

  allServers.forEach((server) => {
    if (server === 'home') return;
    tryRoot(ns, server);
  });
}

function tryRoot(ns: NS, hostname: string): boolean {
  if (ns.hasRootAccess(hostname)) return true;

  const portsRequires = ns.getServerNumPortsRequired(hostname);
  let portsOpened = 0;

  if (ns.fileExists('BruteSSH.exe', 'home')) {
    ns.brutessh(hostname);
    portsOpened++;
  }

  if (ns.fileExists('FTPCrack.exe', 'home')) {
    ns.ftpcrack(hostname);
    portsOpened++;
  }

  if (ns.fileExists('HTTPWorm.exe', 'home')) {
    ns.httpworm(hostname);
    portsOpened++;
  }

  if (ns.fileExists('relaySMTP.exe', 'home')) {
    ns.relaysmtp(hostname);
    portsOpened++;
  }

  if (ns.fileExists('SQLInject.exe', 'home')) {
    ns.sqlinject(hostname);
    portsOpened++;
  }

  if (portsOpened >= portsRequires) {
    ns.nuke(hostname);
  }

  return ns.hasRootAccess(hostname);
}
