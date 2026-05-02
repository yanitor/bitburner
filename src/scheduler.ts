import { NS } from '@ns';
import { discoverServers, getBestTargets } from '@/scanner.js';
import { calcThreads, CONFIG } from '@/lib/utils.js';

export async function main(ns: NS): Promise<void> {
  ns.disableLog('sleep');
  ns.disableLog('getServerSecurityLevel');
  ns.disableLog('getServerMoneyAvailable');
  ns.ui.openTail();

  const interval = CONFIG.SCHEDULER_INTERVAL;

  while (true) {
    ns.clearLog();
    let totalThreads = 0; // pro Zyklus zurücksetzen

    const targets = getBestTargets(ns, 1);
    const target = targets[0];

    if (!target) {
      ns.print('No suitable target found');
      await ns.sleep(interval);
      continue;
    }

    const allServers = discoverServers(ns);
    const workers = allServers.filter((hostname) => {
      return ns.hasRootAccess(hostname) && ns.getServerMaxRam(hostname) > 0 && hostname !== 'home';
    });

    // --- Zielzustand berechnen (einmal pro Zyklus) ---
    const sec = ns.getServerSecurityLevel(target.hostname);
    const minSec = ns.getServerMinSecurityLevel(target.hostname);
    const money = ns.getServerMoneyAvailable(target.hostname);
    const maxMoney = ns.getServerMaxMoney(target.hostname);

    const securityThresh = minSec + CONFIG.SECURITY_THRESHOLD;
    const moneyThresh = maxMoney * CONFIG.MONEY_THRESHOLD;

    const needWeaken = sec > securityThresh;
    const needGrow = !needWeaken && money < moneyThresh;

    let script: string;
    let mode: string;

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
    const secRatio = minSec > 0 ? sec / minSec : 0;

    // --- Dashboard nur einmal pro Zyklus ausgeben ---
    ns.print('=== Scheduler Dashboard ===');
    ns.print(`Mode:     ${mode}`);
    ns.print(`Target:   ${target.hostname}`);
    ns.print(
      `Money:    ${money.toLocaleString()} / ${maxMoney.toLocaleString()} ` +
        `(thresh=${moneyThresh.toLocaleString()})`,
    );
    ns.print(
      `Security: ${sec.toFixed(2)} / ${minSec.toFixed(2)} ` +
        `(thresh=${securityThresh.toFixed(2)}, ratio=${secRatio.toFixed(2)}x)`,
    );
    ns.print(`Flags:    needWeaken=${needWeaken} needGrow=${needGrow}`);
    ns.print(`Workers:  ${workers.length}`);
    ns.print(`Script:   ${script} (${scriptRam.toFixed(2)} GB)`);
    ns.print(`Interval: ${interval} ms`);
    ns.print('---------------------------------');

    // --- Worker starten ---
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
