import * as Config from "./config/config";
import {NestManager} from "./components/nest/NestManager";

import * as Profiler from "screeps-profiler";
import { log } from "./lib/logger/log";

// Any code written outside the `loop()` method is executed only when the
// Screeps system reloads your script.
// Use this bootstrap wisely. You can cache some of your stuff to save CPU.
// You should extend prototypes before the game loop executes here.

// This is an example for using a config variable from `config.ts`.
// NOTE: this is used as an example, you may have better performance
// by setting USE_PROFILER through webpack, if you want to permanently
// remove it on deploy
// Start the profiler
if (Config.USE_PROFILER) {
  Profiler.enable();
}

log.info(`loading revision: ${ __REVISION__ }`);

function mloop() {

  // Check memory for null or out of bounds custom objects
  if (!Memory.uuid || Memory.uuid > 100) {
    Memory.uuid = 0;
  }

  // Clears any non-existing creep memory.
  for (const name in Memory.creeps) {
    if (!Game.creeps[name]) {
      log.info("Clearing non-existing creep memory:", name);
      delete Memory.creeps[name];
    }

    if (Game.creeps[name] && !Game.creeps[name].memory.nest) {
      Game.creeps[name].memory.nest = "W77N32";
    }
  }

  // Begin here
  const nestManager = new NestManager(Memory.nests);
  nestManager.run();

  // for (const i in Game.rooms) {
  //   const room: Room = Game.rooms[i];
  //   (new RoomManager()).run(room);
  //   // (new CreepManager()).run(room);
  //   (new TowerManager()).run(room);
  // }
}

/**
 * Screeps system expects this "loop" method in main.js to run the
 * application. If we have this line, we can be sure that the globals are
 * bootstrapped properly and the game loop is executed.
 * http://support.screeps.com/hc/en-us/articles/204825672-New-main-loop-architecture
 *
 * @export
 */
export const loop = !Config.USE_PROFILER ? mloop : () => { Profiler.wrap(mloop); };
