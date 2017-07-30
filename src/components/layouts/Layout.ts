
export abstract class RoomLayout {
	constructor(protected room: Room) {
		_.set(room, "memory.layouts", _.get(room, "memory.layouts", []));
	}
}

export class HarvestSourcesLayout extends RoomLayout {
	static key: string = "harvest_resources";
	run() {
		let room: Room = this.room;
		
		if(!_.includes(room.memory.layouts, HarvestSourcesLayout.key)) {
			let creep: Creep = _.first(room.find<Creep>(FIND_MY_CREEPS, {
				filter: (c: Creep) => {
					return c.pos.x===0 || c.pos.y===0 || c.pos.x===49 || c.pos.y===49
				}
			}));
			let resources = room.find(FIND_SOURCES);

			if (!creep) {
				return false;
			}

			_.forEach(resources, (r: Resource) => {
				let path = creep.pos.findPathTo(r.pos);
				_.forEach(path, (pos: PathStep) => {
					let p: RoomPosition = new RoomPosition(pos.x, pos.y, room.name);
					room.createConstructionSite(p, STRUCTURE_ROAD);
				});
			});

			room.memory.layouts.push(HarvestSourcesLayout.key)
		}
		
		return true;
	}
}

export class BaseLevelOneRoomLayout extends RoomLayout {
	static key: string = "base_level_1";
	run() {
		let room: Room = this.room;
		
		if(!_.includes(room.memory.layouts, BaseLevelOneRoomLayout.key)) {
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

			room.memory.layouts.push(BaseLevelOneRoomLayout.key)
		}
		
		return true;
	}
}