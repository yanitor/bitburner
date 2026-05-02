/** @param {NS} ns */
export async function main(ns) {
  const ram = 512;

  let i = ns.cloud.getServerNames().length;

  while (i < ns.cloud.getServerLimit()) {
    ns.tprint(ns.cloud.getRamLimit(ram));
    if (ns.getServerMoneyAvailable('home') > ns.cloud.getRamLimit(ram)) {
      const hostname = ns.cloud.purchaseServer('cloud-server-' + i, ram);
      ns.scp('early-hack-script.js', hostname);
      ns.exec(
        'early-hack-script.js',
        hostname,
        Math.floor(ns.getServerMaxRam(hostname) / ns.getScriptRam('early-hack-script.js', hostname)),
      );
      ++i;
    }
    await ns.sleep(1000);
  }
}
