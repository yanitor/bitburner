import { NS } from '@ns';
import { discoverServers, getBestTargets } from '@/scanner.js';
import { calcThreads, CONFIG } from '@/lib/utils.js';

export async function main(ns: NS): Promise<void> {
  ns.disableLog('sleep');
  ns.disableLog('getServerSecurityLevel');
  ns.disableLog('getServerMoneyAvailable');
  ns.ui.openTail();

  let script: string;
  let mode: string;
  const interval = CONFIG.SCHEDULER_INTERVAL;

  while (true) {
    ns.clearLog();
    const targets = getBestTargets(ns, 1);
    const target = targets[0];

    if (!target) {
      ns.print('No suitable target found');
      await ns.sleep(interval);
      continue;
    }

    const sec = ns.getServerSecurityLevel(target.hostname);
    const minSec = ns.getServerMinSecurityLevel(target.hostname);
    const money = ns.getServerMoneyAvailable(target.hostname);
    const maxMoney = ns.getServerMaxMoney(target.hostname);

    const needWeaken = sec > minSec + CONFIG.SECURITY_THRESHOLD;
    const needGrow = !needWeaken && money < maxMoney * CONFIG.MONEY_THRESHOLD;

    const allServers = discoverServers(ns);
    const workers = allServers.filter((hostname) => {
      return ns.hasRootAccess(hostname) && ns.getServerMaxRam(hostname) > 0 && hostname !== 'home';
    });

    if (needWeaken) {
      script = CONFIG.WEAKEN_SCRIPT;
      mode = 'WEAKEN';
    } else if (needGrow) {
      script = CONFIG.GROW_SCRIPT;
      mode = 'GROW';
    } else {
      script = CONFIG.HACK_SCRIPT;
      mode = 'HACK';
    }

    const scriptRam = ns.getScriptRam(script, 'home');

    const moneyRatio = maxMoney > 0 ? money / maxMoney : 0;
    const secRatio = minSec > 0 ? sec / minSec : 0;

    let totalThreads = 0;

    ns.print('=== Scheduler Dashboard ===');
    ns.print(`Mode:     ${mode}`);
    ns.print(`Target:   ${target.hostname}`);
    ns.print(`Money: ${money.toLocaleString()} / ${maxMoney.toLocaleString()}`);
    ns.print(`Security: ${sec.toFixed(2)} / ${minSec.toFixed(2)} ` + `(${secRatio.toFixed(2)}x)`);
    ns.print(`Workers:  ${workers.length}`);
    ns.print(`Script:   ${script} (${scriptRam.toFixed(2)} GB)`);
    ns.print(`Interval: ${interval} ms`);
    ns.print('---------------------------------');

    for (const host of workers) {
      const maxRam = ns.getServerMaxRam(host);
      const usedRam = ns.getServerUsedRam(host);
      const freeRam = maxRam - usedRam;

      const threads = calcThreads(freeRam, scriptRam);
      if (threads <= 0) continue;

      if (ns.isRunning(script, host, target.hostname)) continue;

      ns.exec(script, host, threads, target.hostname);

      totalThreads += threads;
    }
    ns.print(`Threads started this cycle: ${totalThreads}`);
    await ns.sleep(interval);
  }
}
