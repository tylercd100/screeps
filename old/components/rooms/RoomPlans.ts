/*
* @Author: Tyler Arbon
* @Date:   2017-07-28 23:45:43
* @Last Modified by:   Tyler Arbon
* @Last Modified time: 2017-08-01 17:08:56
*/

'use strict';

import {WorkerCreep} from "./../creeps/types/WorkerCreep";
import {MeleeCreep} from "./../creeps/types/MeleeCreep";
import {MinerCreep} from "./../creeps/types/MinerCreep";
import {HaulerCreep} from "./../creeps/types/HaulerCreep";
import {EnergizerCreep} from "./../creeps/types/EnergizerCreep";
import {HarvesterCreep} from "./../creeps/types/HarvesterCreep";
import {BaseLevelOneRoomLayout, HarvestSourcesLayout} from "./../layouts/Layout";

export abstract class RoomPlan {
	creeps: Creep[];
	creepCount: number = 0;

	constructor(protected room: Room) {
		this.creeps     = this.room.find<Creep>(FIND_MY_CREEPS);
		this.creepCount = _.size(this.creeps);
	}

	run() {
    	this.handleLayouts();
        this.handle();
    	this.handleCreeps();
	}

	protected handleCreeps() {
		for(const name in this.creeps) {
            let creep = this.creeps[name];
            switch (creep.memory.type) {
                case 'worker':
                    new WorkerCreep(creep).run();
                    break;
                case 'melee':
                    new MeleeCreep(creep).run();
                    break;
                case 'miner':
                    new MinerCreep(creep).run();
                    break;
                case 'hauler':
                    new HaulerCreep(creep).run();
                    break;
                case 'energizer':
                    new EnergizerCreep(creep).run();
                    break;
                case 'harvester':
                    new HarvesterCreep(creep).run();
                    break;
                default:
                    console.log("Unknown type for creep:", creep.name);
                    break;
            }
        }
	}

	protected abstract handleLayouts(): void;
	protected abstract handle(): void;
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

