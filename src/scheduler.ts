import { NS } from '@ns';
import { discoverServers, getBestTargets } from '@/scanner.js';
import { calcThreads, CONFIG } from '@/lib/utils.js';

export async function main(ns: NS): Promise<void> {
  const script = 'early-hack-script.js';
  const interval = CONFIG.SCHEDULER_INTERVAL;

  while (true) {
    const targets = getBestTargets(ns, 1);
    const target = targets[0];
    if (!target) {
      ns.tprint('No suitable target found');
      await ns.sleep(interval);
      continue;
    }

    const allServers = discoverServers(ns);
    const workers = allServers.filter((hostname) => {
      return ns.hasRootAccess(hostname) && ns.getServerMaxRam(hostname) > 0 && hostname !== 'home';
    });

    const scriptRam = ns.getScriptRam(script, 'home');

    for (const host of workers) {
      const maxRam = ns.getServerMaxRam(host);
      const usedRam = ns.getServerUsedRam(host);
      const freeRam = maxRam - usedRam;

      const threads = calcThreads(freeRam, scriptRam);
      if (threads <= 0) continue;

      if (ns.isRunning(script, host, target.hostname)) continue;

      ns.exec(script, host, threads, target.hostname);
    }

    await ns.sleep(interval);
  }
}
