/*
* @Author: Tyler Arbon
* @Date:   2017-07-28 23:45:43
* @Last Modified by:   Tyler Arbon
* @Last Modified time: 2017-08-01 10:45:49
*/

'use strict';

import {WorkerCreep} from "./../creeps/types/WorkerCreep";
import {MeleeCreep} from "./../creeps/types/MeleeCreep";
import {MinerCreep} from "./../creeps/types/MinerCreep";
import {HaulerCreep} from "./../creeps/types/HaulerCreep";
import {EnergizerCreep} from "./../creeps/types/EnergizerCreep";
import {HarvesterCreep} from "./../creeps/types/HarvesterCreep";
import * as Plans from "./Plans";

import {BaseLevelOneRoomLayout, HarvestSourcesLayout} from "./../layouts/Layout";

export abstract class RoomPlan {
	creeps: Creep[];
	creepCount: number = 0;

	constructor(protected room: Room) {
		this.creeps     = this.room.find<Creep>(FIND_MY_CREEPS);
		this.creepCount = _.size(this.creeps);
	}

	run() {
		this.countHarvestPoints();
    	this.handleLayouts();
        this.handle();
    	this.handleCreeps();
	}

	protected countHarvestPoints() {
		let points = _.get<any[]|null>(this.room, "memory.harvest_points");
		if (!points) {
			points = [];
			let sources = this.room.find(FIND_SOURCES);
			_.forEach(sources, (source: Source) => {
				for(var i = 0; i<3; i++) {
					for(var j = 0; j<3; j++) {
						let x = (source.pos.x - 1) + i;
						let y = (source.pos.y - 1) + j;
						if(!_.includes(this.room.lookForAt(LOOK_TERRAIN, x, y), "wall")) {
							points.push({room: this.room.name, x: x, y: y});
						}
					}
				}
			});
			_.set(this.room, "memory.harvest_points", points);
		}
	}

	protected handleCreeps() {
		for(const name in this.creeps) {
            let creep = this.creeps[name];
            switch (creep.memory.type) {
                case 'worker':
                    new WorkerCreep(this.room, creep).run();
                    break;
                case 'melee':
                    new MeleeCreep(this.room, creep).run();
                    break;
                case 'miner':
                    new MinerCreep(this.room, creep).run();
                    break;
                case 'hauler':
                    new HaulerCreep(this.room, creep).run();
                    break;
                case 'energizer':
                    new EnergizerCreep(this.room, creep).run();
                    break;
                case 'harvester':
                    new HarvesterCreep(this.room, creep).run();
                    break;
                default:
                    console.log("Unknown type for creep:", creep.name);
                    break;
            }
        }
	}

	protected abstract handleLayouts();
	protected abstract handle();
}

export class HarvestSourcesRoomPlan extends RoomPlan {
	protected handle() {
		
	}

	protected handleLayouts() {
		(new HarvestSourcesLayout(this.room)).run()
	}
}

export class DefendRoomPlan extends RoomPlan {
	protected handle() {
		
	}

	protected handleLayouts() {

	}
}

export class AttackRoomPlan extends RoomPlan {
	protected handle() {
		
	}

	protected handleLayouts() {

	}
}

export class IgnoreRoomPlan extends RoomPlan {
	protected handle() {
		
	}

	protected handleLayouts() {
		
	}

}

export class BaseRoomPlan extends RoomPlan {
    protected handle() {
        
    }

    protected handleLayouts() {
    	(new BaseLevelOneRoomLayout(this.room)).run();
    }
}

