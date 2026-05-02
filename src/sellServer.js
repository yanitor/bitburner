/** @param {NS} ns */
export async function main(ns) {
  const size = ns.args[0];
  const server = ns.args[1];

  const script_ram_size = ns.getScriptRam('early-hack-script.js', 'home');

  await ns.cloud.upgradeServer(server, size);
  await ns.sleep(1000);
  await ns.killall(server);
  await ns.sleep(1000);
  await ns.exec('early-hack-script.js', server, Math.floor(ns.getServerMaxRam(server) / script_ram_size));
}
