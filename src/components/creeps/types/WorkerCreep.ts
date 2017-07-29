/*
* @Author: Tyler Arbon
* @Date:   2017-07-26 22:52:14
* @Last Modified by:   Tyler Arbon
* @Last Modified time: 2017-07-29 10:49:32
*/

'use strict';

import {Task, RepairTask, BuildTask, WithdrawFromContainer, HarvestTask, RenewTask, FillWithEnergyTask, UpgradeControllerTask} from "./../tasks/Tasks";
import {BaseCreep} from "./BaseCreep";

export class WorkerCreep extends BaseCreep {
    run() {

        this.decrementSleep();

        if (!this.isAsleep()) {
            let creep = this.creep;
            let room = creep.room;
            let controller = room.controller;
            let containers = this.getContainers();
            let container = this.getClosestContainerWithResource(RESOURCE_ENERGY);
            let creeps = room.find<Creep>(FIND_MY_CREEPS);
            let workers = room.find<Creep>(FIND_MY_CREEPS, {filter: (creep) => creep.memory.type === "worker"});
            let energizers = room.find<Creep>(FIND_MY_CREEPS, {filter: (creep) => creep.memory.type === "energizer"});
            let workersNotExceeded = workers.length <= (containers.length > 1 ? 5 : 8)
            
            this.setRenewToggle();
            this.setWorkingToggle();

            let task: Task = Task.fromMemory(creep)
            
            if(!task) {
                if(!creep.memory.working) {
                    if (container) {
                        task = new WithdrawFromContainer(container, RESOURCE_ENERGY);
                    } else {
                        task = new HarvestTask(this.getClosestSource());
                    }
                } else {
                    if (room.energyAvailable < room.energyCapacityAvailable && creeps.length <= 8) {
                        task = new FillWithEnergyTask(this.getClosestFillable());
                    } else if (controller.ticksToDowngrade < 2000 || controller.level < 2) {
                        task = new UpgradeControllerTask(controller);
                    } else if (room.energyAvailable > 300 || energizers.length > 0) {
                        var site = this.getClosestConstructionSite();
                        if(site) {
                            task = new BuildTask(site);
                        } else {
                            // var damaged = this.getClosestDamagedStructure();
                            // if(damaged) {
                            //     task = new RepairTask(damaged);
                            // } else {
                                task = new UpgradeControllerTask(controller);
                            // }
                        }
                    }
                }

                if(task) {
                    console.log(creep.name,"is starting task",task.taskType);
                }
            }

            if(task) {
                let result = task.run(creep);
                if (result === Task.IN_PROGRESS) {
                    creep.memory.task = task.toMemory();
                } else {
                    creep.memory.task = null;
                }
            }
        }
    }

    static type: string = "worker";

    static createCreep(room: Room, level: number = 1): string|number|null {
        const spawn = WorkerCreep.getSpawn(room);
        const body = WorkerCreep.getBody(room, level);
        const name = WorkerCreep.getName();
        const memory = WorkerCreep.getMemory();
        return spawn.createCreep(body, name, memory);
    }

    static getMemory(): {[key: string]: any} {
        return _.merge(BaseCreep.getMemory(), {
            type: WorkerCreep.type,
        });
    }

    static getName(): string {
        return WorkerCreep.type+"-"+BaseCreep.getName();
    }

    static getBody(room: Room, level: number = 1): string[] {
        switch (level) {
            case 1: // 300
                return [WORK, WORK, CARRY, MOVE];
            case 2: // 550
                return [WORK, WORK, WORK, CARRY, CARRY, CARRY, MOVE, MOVE]
            case 3: // 800
            case 4:
            default:
                return [WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE, MOVE, MOVE];

        }
    }
}
