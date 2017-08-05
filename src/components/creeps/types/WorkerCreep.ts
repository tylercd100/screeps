/*
* @Author: Tyler Arbon
* @Date:   2017-07-26 22:52:14
* @Last Modified by:   Tyler Arbon
* @Last Modified time: 2017-08-03 11:17:36
*/

'use strict';

import {Task, BuildTask, WithdrawFromStockpileTask, HarvestTask, FillWithEnergyTask, UpgradeControllerTask} from "./../tasks/Tasks";
import {BaseCreep} from "./BaseCreep";
import {Nest} from "./../../nest/Nest";

export class WorkerCreep extends BaseCreep {
    protected handle(task: Task): Task {
        let creep = this.creep;
        let room = creep.room;
        let controller = room.controller;
        let container = this.getClosestStockpileWithResource(RESOURCE_ENERGY);
        let creeps = room.find<Creep>(FIND_MY_CREEPS);
        let energizers = _.filter(Game.creeps, (x) => {return x.memory.nest === creep.memory.nest && x.memory.type === "energizer"});
        
        if(!task) {
            if(!creep.memory.working) {
                let resource = this.getClosestDroppedResource();
                if (resource) {
                    task = new HarvestTask(resource);
                }else if (container) {
                    task = new WithdrawFromStockpileTask(container, RESOURCE_ENERGY);
                } else {
                    task = new HarvestTask(this.getClosestSource());
                }
            } else {
                if (room.energyAvailable < room.energyCapacityAvailable && (energizers.length === 0 || creeps.length <= 8)) {
                    task = new FillWithEnergyTask(this.getClosestFillable());
                } else if (controller && (controller.ticksToDowngrade < 2000 || controller.level < 2)) {
                    task = new UpgradeControllerTask(controller);
                } else if (room.energyAvailable >= 300 || energizers.length > 0) {
                    var site = this.getClosestConstructionSite();
                    if(site) {
                        task = new BuildTask(site);
                    } else if (controller) {
                        // var damaged = this.getClosestDamagedStructure();
                        // if(damaged) {
                        //     task = new RepairTask(damaged);
                        // } else {

                            task = new UpgradeControllerTask(controller);
                        // }
                    }
                }
            }
        }

        return task;
    }

    protected draw() {
        this.creep.room.visual.circle(this.creep.pos, {fill: 'transparent', radius: 0.55, stroke: 'green'});
    }

    static type: string = "worker";

    static createCreep(spawn: Spawn, nest: Nest, level: number = 1): string|number|null {
        const body = WorkerCreep.getBody(level);
        const name = WorkerCreep.getName();
        const memory = WorkerCreep.getMemory(nest);
        return spawn.createCreep(body, name, memory);
    }

    static getMemory(nest: Nest): {[key: string]: any} {
        return _.merge(BaseCreep.getMemory(nest), {
            type: WorkerCreep.type,
        });
    }

    static getName(): string {
        return WorkerCreep.type+"-"+BaseCreep.getName();
    }

    static getBody(level: number = 1): string[] {
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
