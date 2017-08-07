/*
* @Author: Tyler Arbon
* @Date:   2017-07-27 16:58:47
* @Last Modified by:   Tyler Arbon
* @Last Modified time: 2017-08-06 11:43:31
*/

'use strict';

import * as Config from "./../../../config/config";

export interface ITaskMemory {
	taskType: string;
	targetRoom?: string | null;
	targetId?: string;
	targetPos?: {
		x: number;
		y: number;
		roomName: string;
	};
	resource: string;
	forceGoto: boolean;
}

export abstract class Task {
	constructor(protected target: undefined | null | any) {}

	public abstract run(creep: Creep): number;

	static DONE: number = 2;
	static IN_PROGRESS: number = 1;
	static FAILED: number = 0;

	public taskType: string = "task";
	protected resource: string;
	protected forceGoto: boolean;

	static fromMemory(creep: Creep): Task|undefined {
		let m: ITaskMemory|undefined = _.get<ITaskMemory>(creep, "memory.task", undefined);
		
		if (_.isObject(m)) {
			switch (m.taskType) {
				case "harvest":
					return new HarvestTask(Game.getObjectById<Source|Mineral>(m.targetId));
				case "reserve":
					return new ReserveTask(Game.getObjectById<Controller>(m.targetId));
				case "goto_target":
					return new GotoTargetTask(Game.getObjectById<Creep|Structure|Flag>(m.targetId));
				case "attack":
					return new AttackTask(Game.getObjectById<Creep|Structure>(m.targetId));
				case "ranged_attack":
					return new RangedAttackTask(Game.getObjectById<Creep|Structure>(m.targetId));
				case "renew":
					return new RenewTask(Game.getObjectById<Spawn>(m.targetId));
				case "repair":
					return new RepairTask(Game.getObjectById<Structure>(m.targetId));
				case "fill_with_energy":
					return new FillWithEnergyTask(Game.getObjectById<StructureExtension|StructureSpawn>(m.targetId));
				case "deposit_into_container":
					return new DepositIntoStockpileTask(Game.getObjectById<StructureContainer|StructureStorage>(m.targetId), m.resource);
				case "withdraw_from_container":
					return new WithdrawFromStockpileTask(Game.getObjectById<StructureContainer|StructureStorage>(m.targetId), m.resource, m.forceGoto);
				case "build":
					return new BuildTask(Game.getObjectById<ConstructionSite>(m.targetId));
				case "upgrade_controller":
					return new UpgradeControllerTask(Game.getObjectById<StructureController>(m.targetId));
				case "goto_room_position":
					return new GotoRoomTask(m.targetRoom);
				default:
					console.log("Unknown task type:", m.taskType);
					return;
			}
		}

		return;
	}

	public toMemory(): ITaskMemory {
		return {
			targetId: this.target.id,
			taskType: this.taskType,
			resource: this.resource,
			forceGoto: this.forceGoto,
		}
	}
}

export class BuildTask extends Task {
	public taskType: string = "build";
	constructor(protected target: undefined | null | ConstructionSite) {
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
	constructor(protected target: undefined | null | Structure) {
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
	constructor(protected target: undefined | null | Source | Mineral | Resource) {
		super(target);
	}

	run(creep: Creep): number {
		let target = this.target;

		if (!target) {
			return Task.FAILED;
		}

		if (target instanceof Source && target.energy <= 10) {
			return Task.DONE;
		}

		if (_.sum(creep.carry) === creep.carryCapacity) {
			return Task.DONE;
		}

		let harvestResult: number;
		if(target instanceof Resource) {
			harvestResult = creep.pickup(target)
		} else {
			harvestResult = creep.harvest(target);
		}
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

export class ReserveTask extends Task {
	public taskType: string = "reserve";
	constructor(protected target: undefined | null | Controller) {
		super(target);
	}

	run(creep: Creep): number {
		let target = this.target;

		if (!target) {
			return Task.FAILED;
		}

		if (target.my || (target.reservation && target.reservation.ticksToEnd >= 5000)) {
			return Task.DONE;
		}

		let reserveResult: number;
		reserveResult = creep.reserveController(target);
        if (reserveResult === ERR_NOT_IN_RANGE) {
        	let moveResult = creep.moveTo(target.pos, {reusePath: 10});
            if (moveResult === ERR_NO_PATH) {
                return Task.FAILED;
            }
        }

        return Task.IN_PROGRESS;
	}
}

export class GotoTargetTask extends Task {
	public taskType: string = "goto_target";
	constructor(protected target: undefined | null | Structure | Creep | Flag) {
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
	public taskType: string = "attack";
	constructor(protected target: undefined | null | Creep|Spawn|Structure) {
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

export class RangedAttackTask extends Task {
	public taskType: string = "ranged_attack";
	constructor(protected target: undefined | null | Creep|Spawn|Structure) {
		super(target);
	}

	run(creep: Creep): number {
		let target = this.target;

		if (!target) {
			return Task.FAILED;
		}

		let result = creep.rangedAttack(target);

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
	constructor(protected target: undefined | null | string) {
		super(target);
	}

	run(creep: Creep): number {
		if (!this.target) {
			return Task.FAILED;
		}

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


		let x = creep.moveTo(pos, {reusePath: 10, maxRooms: 16});
		if(x === ERR_NO_PATH) {
			x = creep.move(creep.pos.getDirectionTo(pos));
		}
    	switch (x) {
    		case ERR_NO_PATH:
    			return Task.FAILED;
    		case OK:
    		default:
        		return Task.IN_PROGRESS;
    	}

	}

	public toMemory(): ITaskMemory {
		return {
			targetRoom: this.target,
			taskType: this.taskType,
			resource: this.resource,
			forceGoto: this.forceGoto,
		}
	}
}

export class FillWithEnergyTask extends Task {
	public taskType: string = "fill_with_energy";
	constructor(protected target: undefined | null | StructureExtension|StructureSpawn|StructureTower) {
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

export class WithdrawFromStockpileTask extends Task {
	public taskType: string = "withdraw_from_container";
	constructor(protected target: undefined | null | StructureLink|StructureContainer|StructureStorage, protected resource: string = RESOURCE_ENERGY, protected forceGoto: boolean = false) {
		super(target);
	}

	run(creep: Creep): number {
		let target = this.target;
		let empty = (target.store && target.store[this.resource] === 0) || (target.energy && target.energy === 0);

		if (!target || (!target.store && !target.energy)) {
			return Task.FAILED;
		}

		if (_.sum(creep.carry) === creep.carryCapacity || (empty && !this.forceGoto)) {
			return Task.DONE;
		}

		let result = creep.withdraw(target, this.resource);
        if (result === ERR_NOT_IN_RANGE) {
            if (creep.moveTo(target.pos, {reusePath: 10}) === ERR_NO_PATH) {
                return Task.FAILED;
            }
        }

        return Task.IN_PROGRESS;
	}
}

export class DepositIntoStockpileTask extends Task {
	public taskType: string = "deposit_into_container";
	constructor(protected target: undefined | null | StructureContainer|StructureStorage|StructureLink, protected resource: string = RESOURCE_ENERGY) {
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
	constructor(protected target: undefined | null | StructureSpawn) {
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
	constructor(protected target: null | StructureController) {
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
