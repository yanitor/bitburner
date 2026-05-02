import { NS } from '@ns';
import { discoverServers } from '@/scanner';
import { CONFIG } from '@/lib/utils';

export async function main(ns: NS): Promise<void> {
  const allServers = discoverServers(ns);

  const targets = allServers.filter((hostname) => {
    return ns.hasRootAccess(hostname) && ns.getServerMaxRam(hostname) > 0 && hostname !== 'home';
  });

  const files = [CONFIG.HACK_SCRIPT, CONFIG.GROW_SCRIPT, CONFIG.WEAKEN_SCRIPT];

  for (const host of targets) {
    ns.scp(files, host, 'home');
  }

  ns.tprint(`${targets.length} Server deployed`);
}
