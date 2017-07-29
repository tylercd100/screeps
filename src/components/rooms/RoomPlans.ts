/*
* @Author: Tyler Arbon
* @Date:   2017-07-28 23:45:43
* @Last Modified by:   Tyler Arbon
* @Last Modified time: 2017-07-29 00:14:26
*/

'use strict';

export abstract class RoomPlan {
	constructor(protected room: Room) {}

	abstract run();
}

export class RoomOnePlan extends RoomPlan {
	run() {
		let room: Room = this.room;
		let spawns: StructureSpawn[] = room.find<StructureSpawn>(FIND_MY_SPAWNS)
		let spawn: StructureSpawn = spawns.length > 0 ? spawns[0] : null;
		let resources = room.find(FIND_SOURCES);

		if (!spawn) {
			return false;
		}

		_.forEach(resources, (r: Resource) => {
			let path = spawn.pos.findPathTo(r.pos);
			_.forEach(path, (pos: PathStep) => {
				let p: RoomPosition = new RoomPosition(pos.x, pos.y, room.name);
				room.createConstructionSite(p, STRUCTURE_ROAD);
			});
		});

		return true;
	}
}