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
        if(!task) {
            let creep = this.creep;
            let room = creep.room;
            let controller = room.controller;
            let container = this.getClosestStockpileWithResource(RESOURCE_ENERGY);
            let creeps = room.find<Creep>(FIND_MY_CREEPS);
            let energizers = _.filter(Game.creeps, (x) => {return x.memory.nest === creep.memory.nest && x.memory.type === "energizer"});
            let site = this.getClosestConstructionSite();

            let doFill = room.energyAvailable < room.energyCapacityAvailable && (energizers.length === 0 || creeps.length <= 8);
            let doEmergencyUpgrade = (controller && (controller.ticksToDowngrade < 2000 || controller.level < 2));
            let doBuildOrUpgrade = room.energyAvailable >= 300 || energizers.length > 0;
            let doBuild = doBuildOrUpgrade && !!site;
            let doUpgrade = doBuildOrUpgrade && !!controller;
            
            if(!creep.memory.working) {
                
                let getFromAnySource = () => {
                    let resource = this.getClosestDroppedResource();
                    let task: Task;
                    if (resource) {
                        task = new HarvestTask(resource);
                    } else if (container) {
                        task = new WithdrawFromStockpileTask(container, RESOURCE_ENERGY);
                    } else {
                        task = new HarvestTask(this.getClosestSource());
                    }
                    return task;
                }

                let getFromControllerContainer = () => {
                    let container = controller.pos.findClosestByRange<StructureContainer>(FIND_STRUCTURES, {filter: (s: StructureContainer) => s.structureType===STRUCTURE_CONTAINER});
                    return new WithdrawFromStockpileTask(container, RESOURCE_ENERGY);
                }

                if (doFill) {
                    task = getFromAnySource();
                } else if (doEmergencyUpgrade) {
                    task = getFromAnySource();
                } else if (doBuild) {
                    task = getFromAnySource();
                } else if (doUpgrade) {
                    task = getFromControllerContainer();
                } else {
                    task = getFromAnySource();
                }
            } else {
                if (doFill) {
                    task = new FillWithEnergyTask(this.getClosestFillable());
                } else if (doEmergencyUpgrade) {
                    task = new UpgradeControllerTask(controller);
                } else if (doBuild) {
                    task = new BuildTask(site);
                } else if (doUpgrade) {
                    task = new UpgradeControllerTask(controller);
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
