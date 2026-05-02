import { NS } from '@ns';
import { CONFIG } from '@/lib/utils';

export async function main(ns: NS): Promise<void> {
  const ROOTER = 'rooter.js';
  const DEPLOYER = 'deployer.js';
  const SCHEDULER = 'scheduler.js';

  if (ns.isRunning(SCHEDULER, 'home')) {
    return;
  }

  ns.exec(ROOTER, 'home', 1);
  await ns.sleep(CONFIG.INIT_WATCHDOG_SLEEP);

  ns.exec(DEPLOYER, 'home', 1);
  await ns.sleep(CONFIG.INIT_WATCHDOG_SLEEP);

  ns.exec(SCHEDULER, 'home', 1);
  await ns.sleep(CONFIG.INIT_WATCHDOG_SLEEP);
}
