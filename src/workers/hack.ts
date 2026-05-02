import { NS } from '@ns';

export async function main(ns: NS): Promise<void> {
  const hostname = ns.args[0] as string;

  if (!hostname) {
    return;
  }

  while (true) {
    await ns.hack(hostname);
  }
}
