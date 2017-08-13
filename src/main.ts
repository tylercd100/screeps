import * as Config from "./config/config";
import * as Profiler from "screeps-profiler";
import {SerialRaw, Serializable} from "./components/traits";
import {Party} from "./components/party";
import {Colony} from "./components/colony";
import {ColonyRoom} from "./components/colony_room";
import {ColonyCreep} from "./components/colony_creep";

declare global {
	interface Game {
		parties: _.Dictionary<Party>;
		colonies: _.Dictionary<Colony>;
		colony_rooms: _.Dictionary<ColonyRoom>
		colony_creeps: _.Dictionary<ColonyCreep>
	}
}

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


function mloop() {
	startMemory();

	const cName = "Colony 1";
	if (!Game.colonies[cName]) {
		let room: Room
		for (const i in Game.rooms) {
			room = Game.rooms[i];
		}
		new Colony(cName, [new ColonyRoom(room.name, cName, {})]);
	}

	for(const i in Game.colonies) {
		let colony = Game.colonies[i];
		colony.run();
	}
	
	endMemory();
}

/**
 * Unserializes classes from memory
 */
function unserialize<T>(memory: {SerialRaw}): _.Dictionary<T> {
	let result: _.Dictionary<T> = {};
	for (const id in memory) {
		let obj;
		const serial: SerialRaw = memory[id];
		switch (serial.class) {
			case "Party":
				obj = Party.unserialize(serial);
				break;
			case "Colony":
				obj = Colony.unserialize(serial);
				break;
			case "ColonyRoom":
				obj = ColonyRoom.unserialize(serial);
				break;
			case "ColonyCreep":
				obj = ColonyCreep.unserialize(serial);
				break;
			default:
				console.log("I do not know how to unserialize", serial.class);
				break;
		}

		if(obj) {
			result[id] = obj;
		}
	}
	return result;
}

function serialize<T extends Serializable>(data: _.Dictionary<T>): _.Dictionary<SerialRaw> {
	let result: _.Dictionary<SerialRaw> = {};

	_.forIn(data, (item, key: string) => {
		result[key] = item.serialize();
	});

	return result;
}

function startMemory() {
	Game.parties = unserialize<Party>(Memory.parties);
	Game.colony_rooms = unserialize<ColonyRoom>(Memory.colony_rooms);
	Game.colony_creeps = unserialize<ColonyCreep>(Memory.colony_creeps);
	Game.colonies = unserialize<Colony>(Memory.colonies);
	
	// Check memory for null or out of bounds custom objects
	if (!Memory.uuid || Memory.uuid > 100) {
		Memory.uuid = 0;
	}

	// Clears any non-existing creep memory.
	for (const name in Memory.creeps) {
		if (!Game.creeps[name]) {
			console.log("Clearing non-existing creep memory:", name);
			delete Memory.creeps[name];
		}
	}

		// Clears any non-existing creep memory.
	for (const name in Game.colony_creeps) {
		if (!Game.creeps[name]) {
			delete Game.colony_creeps[name];
		}
	}

}

function endMemory() {
	Memory.parties = serialize(Game.parties);
	Memory.colonies = serialize(Game.colonies);
	Memory.colony_rooms = serialize(Game.colony_rooms);
	Memory.colony_creeps = serialize(Game.colony_creeps);
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
