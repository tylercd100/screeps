/*
* @Author: Tyler Arbon
* @Date:   2017-07-27 16:58:47
* @Last Modified by:   Tyler Arbon
* @Last Modified time: 2017-07-29 23:02:00
*/

'use strict';

import * as Config from "./../../../config/config";

export interface ITaskMemory {
	taskType: string;
	targetRoom?: string;
	targetId?: string;
	targetPos?: {
		x: number;
		y: number;
		roomName: string;
	};
	resource: string;
}

export abstract class Task {
	constructor(protected target: any) {}

	public abstract run(creep: Creep): number;

	static DONE: number = 2;
	static IN_PROGRESS: number = 1;
	static FAILED: number = 0;

	public taskType: string = "task";
	protected resource: string;

	static fromMemory(creep: Creep) {
		let m: ITaskMemory = _.get(creep, "memory.task", null);
		
		if (m) {
			switch (m.taskType) {
				case "harvest":
					return new HarvestTask(Game.getObjectById<Source|Mineral>(m.targetId));
				case "renew":
					return new RenewTask(Game.getObjectById<Spawn>(m.targetId));
				case "repair":
					return new RepairTask(Game.getObjectById<Structure>(m.targetId));
				case "fill_with_energy":
					return new FillWithEnergyTask(Game.getObjectById<StructureExtension|StructureSpawn>(m.targetId));
				case "deposit_into_container":
					return new DepositIntoContainerTask(Game.getObjectById<StructureContainer>(m.targetId), m.resource);
				case "withdraw_from_container":
					return new WithdrawFromContainerTask(Game.getObjectById<StructureContainer>(m.targetId), m.resource);
				case "build":
					return new BuildTask(Game.getObjectById<ConstructionSite>(m.targetId));
				case "upgrade_controller":
					return new UpgradeControllerTask(Game.getObjectById<StructureController>(m.targetId));
				case "goto_room_position":
					return new GotoRoomTask(m.targetRoom);
				default:
					console.log("Unknown task type:", m.taskType);
					return null;
			}
		}

		return null;
	}

	public toMemory(): ITaskMemory {
		return {
			targetId: this.target.id,
			taskType: this.taskType,
			resource: this.resource,
		}
	}
}

export class BuildTask extends Task {
	public taskType: string = "build";
	constructor(protected target: ConstructionSite) {
		super(target);
	}

	run(creep: Creep): number {
		let target = this.target;

		if (!target) {
			return Task.FAILED;
		}

		if (_.sum(creep.carry) === 0 || target.progress === target.progressTotal) {
			return Task.DONE;
		}

		let code = creep.build(target);
        if (code === ERR_NOT_IN_RANGE) {
            if (creep.moveTo(target.pos, {reusePath: 10}) === ERR_NO_PATH) {
                return Task.FAILED;
            }
        } else if (code !== OK) {
        	return Task.FAILED;
        }

        return Task.IN_PROGRESS;
	}
}

export class RepairTask extends Task {
	public taskType: string = "repair";
	constructor(protected target: Structure) {
		super(target);
	}

	run(creep: Creep): number {
		let target = this.target;

		if (!target) {
			return Task.FAILED;
		}

		if (_.sum(creep.carry) === 0 || target.hits === target.hitsMax) {
			return Task.DONE;
		}

		let code = creep.repair(target);
        if (code === ERR_NOT_IN_RANGE) {
            if (creep.moveTo(target.pos, {reusePath: 10}) === ERR_NO_PATH) {
                return Task.FAILED;
            }
        } else if (code !== OK) {
        	return Task.FAILED;
        }

        return Task.IN_PROGRESS;
	}
}

export class HarvestTask extends Task {
	public taskType: string = "harvest";
	constructor(protected target: Source | Mineral) {
		super(target);
	}

	run(creep: Creep): number {
		let target = this.target;

		if (!target) {
			return Task.FAILED;
		}

		if (_.sum(creep.carry) === creep.carryCapacity) {
			return Task.DONE;
		}

		let harvestResult = creep.harvest(target);
        if (harvestResult === ERR_NOT_IN_RANGE) {
        	let moveResult = creep.moveTo(target.pos, {reusePath: 10});
            if (moveResult === ERR_NO_PATH) {
                return Task.FAILED;
            }
        } else {
        }

        return Task.IN_PROGRESS;
	}
}

export class GotoTargetTask extends Task {
	public taskType: string = "harvest";
	constructor(protected target: Structure | Creep) {
		super(target);
	}

	run(creep: Creep): number {
		let target = this.target;

		if (!target) {
			return Task.FAILED;
		}

    	let moveResult = creep.moveTo(target.pos, {reusePath: 10});
        if (moveResult === ERR_NO_PATH) {
            return Task.FAILED;
        }

        return Task.IN_PROGRESS;
	}
}

export class AttackTask extends Task {
	public taskType: string = "harvest";
	constructor(protected target: Creep|Spawn|Structure) {
		super(target);
	}

	run(creep: Creep): number {
		let target = this.target;

		if (!target) {
			return Task.FAILED;
		}

		let result = creep.attack(target);

		switch (result) {
			case OK:
				return Task.IN_PROGRESS;
			case ERR_NOT_IN_RANGE:
				let moveResult = creep.moveTo(target.pos);
	            if (moveResult === ERR_NO_PATH) {
	                return Task.FAILED;
	            }
				return Task.IN_PROGRESS;
			default:
				return Task.IN_PROGRESS;
		}
	}
}

export class GotoRoomTask extends Task {
	public taskType: string = "goto_room_position";
	constructor(protected target: string) {
		super(target);
	}

	run(creep: Creep): number {
		let pos = new RoomPosition(24,24,this.target);

		if (!pos) {
			return Task.FAILED;
		}

		// if(_.indexOf(pos.lookFor(LOOK_TERRAIN), "wall") >=0 ) {
		// 	return Task.FAILED;
		// }

		if (creep.room.name === pos.roomName && pos.x !== 49 && pos.y !== 49 && pos.x !== 0 && pos.y !==0) {
			creep.move(creep.pos.getDirectionTo(pos));
			return Task.DONE;
		}


		let x = creep.moveTo(pos, {reusePath: 10});
		if(x === ERR_NO_PATH) {
			x = creep.move(creep.pos.getDirectionTo(pos));
		}
    	switch (x) {
    		case OK:
    			break;
    		case ERR_NO_PATH:
    			return Task.FAILED;
    		default:
        		return Task.IN_PROGRESS;
    	}

	}

	public toMemory(): ITaskMemory {
		return {
			targetRoom: this.target,
			taskType: this.taskType,
			resource: this.resource,
		}
	}
}

export class FillWithEnergyTask extends Task {
	public taskType: string = "fill_with_energy";
	constructor(protected target: StructureExtension|StructureSpawn|StructureTower) {
		super(target);
	}

	run(creep: Creep): number {
		let target = this.target;

		if (!target) {
			return Task.FAILED;
		}

		if (_.sum(creep.carry) === 0 || target.energy === target.energyCapacity) {
			return Task.DONE;
		}

        if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            if (creep.moveTo(target.pos, {reusePath: 10}) === ERR_NO_PATH) {
                return Task.FAILED;
            }
        }

        return Task.IN_PROGRESS;
	}
}

export class WithdrawFromContainerTask extends Task {
	public taskType: string = "withdraw_from_container";
	constructor(protected target: StructureContainer, protected resource: string = RESOURCE_ENERGY) {
		super(target);
	}

	run(creep: Creep): number {
		let target = this.target;

		if (!target || !target.store) {
			return Task.FAILED;
		}

		if (_.sum(creep.carry) === creep.carryCapacity || target.store[this.resource] === 0) {
			return Task.DONE;
		}

        if (creep.withdraw(target, this.resource) === ERR_NOT_IN_RANGE) {
            if (creep.moveTo(target.pos, {reusePath: 10}) === ERR_NO_PATH) {
                return Task.FAILED;
            }
        }

        return Task.IN_PROGRESS;
	}
}

export class DepositIntoContainerTask extends Task {
	public taskType: string = "deposit_into_container";
	constructor(protected target: StructureContainer, protected resource: string = RESOURCE_ENERGY) {
		super(target);
	}

	run(creep: Creep): number {
		let target = this.target;

		if (!target) {
			return Task.FAILED;
		}

		if (_.sum(creep.carry) === 0 || _.sum(target.store) === target.storeCapacity) {
			return Task.DONE;
		}

        if (creep.transfer(target, this.resource) === ERR_NOT_IN_RANGE) {
            if (creep.moveTo(target.pos, {reusePath: 10}) === ERR_NO_PATH) {
                return Task.FAILED;
            }
        }

        return Task.IN_PROGRESS;
	}
}

export class RenewTask extends Task {
	public taskType: string = "renew";
	constructor(protected target: StructureSpawn) {
		super(target);
	}

	run(creep: Creep): number {
		let target = this.target;

		if (!target) {
			return Task.FAILED;
		}

		if (creep.ticksToLive >= Config.DEFAULT_MIN_LIFE_TO_BE_FULL || target.energy === 0) {
			return Task.DONE;
		}

		let result = target.renewCreep(creep);
        if (result === ERR_NOT_IN_RANGE) {
            if (creep.moveTo(target.pos, {reusePath: 10}) === ERR_NO_PATH) {
            	creep.memory.renew = false;
                return Task.FAILED;
            }
        } else if (result !== OK) {
        	creep.memory.renew = false;
        	return Task.FAILED;
        }

        return Task.IN_PROGRESS;
	}
}

export class UpgradeControllerTask extends Task {
	public taskType: string = "upgrade_controller";
	constructor(protected target: StructureController) {
		super(target);
	}

	run(creep: Creep): number {
		let target = this.target;

		if (!target) {
			return Task.FAILED;
		}

		if (_.sum(creep.carry) === 0) {
			return Task.DONE;
		}

        if (creep.transfer(target, RESOURCE_ENERGY) === ERR_NOT_IN_RANGE) {
            if (creep.moveTo(target, {reusePath: 10}) === ERR_NO_PATH) {
                return Task.FAILED;
            }
        }

        return Task.IN_PROGRESS;
	}
}
