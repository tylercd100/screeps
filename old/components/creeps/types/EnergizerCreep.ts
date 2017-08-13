/*
* @Author: Tyler Arbon
* @Date:   2017-07-26 22:52:14
* @Last Modified by:   Tyler Arbon
* @Last Modified time: 2017-08-05 23:34:36
*/

'use strict';

import {Task, WithdrawFromStockpileTask, HarvestTask, GotoTargetTask, FillWithEnergyTask} from "./../tasks/Tasks";
import {BaseCreep} from "./BaseCreep";
import {Nest} from "./../../nest/Nest";

export class EnergizerCreep extends BaseCreep {
    protected handle(task: Task): Task {

        let creep = this.creep;
        let spawn = this.getClosestSpawn();
        let containers = this.getStockpiles();
        let stockpileSpawn: StructureContainer|StructureStorage = this.getSpawnStockpile(spawn);
        let linkSpawn = spawn.pos.findClosestByRange<StructureLink>(FIND_STRUCTURES, {filter: (s) => s.structureType === STRUCTURE_LINK});

        if(!task) {
            if(!creep.memory.working) {
                if (containers.length === 0) {
                    task = new HarvestTask(this.getClosestSource());
                } else if (linkSpawn && linkSpawn.energy > 0) {
                    task = new WithdrawFromStockpileTask(linkSpawn, RESOURCE_ENERGY);
                } else if (stockpileSpawn) {
                    task = new WithdrawFromStockpileTask(stockpileSpawn, RESOURCE_ENERGY);
                } else {
                    // task = new GotoTargetTask(stockpileSpawn);
                }
            } else {
                let fillable = this.getClosestFillable();

                if(creep.room.energyAvailable >= 300) {
                    let tower = this.getClosestTower();
                    if(tower && ((tower.energy < 300 && creep.carryCapacity > 150) || tower.energy < 25)) {
                        fillable = tower;
                    }
                }

                if(fillable) {
                    task = new FillWithEnergyTask(fillable);
                } else {
                    // task = new GotoTargetTask(stockpileSpawn);
                    this.setSleep(5);
                }
            }
        }

        return task;
    }

    protected draw() {
        this.creep.room.visual.circle(this.creep.pos, {fill: 'transparent', radius: 0.55, stroke: 'yellow'});
    }

    static type: string = "energizer";

    static createCreep(spawn: Spawn, nest: Nest, level: number = 1): string|number|null {
        const body = EnergizerCreep.getBody(level);
        const name = EnergizerCreep.getName();
        const memory = EnergizerCreep.getMemory(nest);
        return spawn.createCreep(body, name, memory);
    }

    static getMemory(nest: Nest): {[key: string]: any} {
        return _.merge(BaseCreep.getMemory(nest), {
            type: EnergizerCreep.type,
        });
    }

    static getName(): string {
        return EnergizerCreep.type+"-"+BaseCreep.getName();
    }

    /**
     * MOVE          50
     * WORK          100
     * CARRY         50
     * ATTACK        80
     * RANGED_ATTACK 150
     * HEAL          250
     * CLAIM         600
     * TOUGH         10
     * @param  {Room}     room [description]
     * @return {string[]}      [description]
     */
    static getBody(level: number): string[] {
        switch (level) {
            case 1: // 300
                return [WORK, CARRY, CARRY, CARRY, MOVE];
            case 2: // 550
                return [WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE];
            case 3: // 800
            case 4:
                return [WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE];
            case 5:
            default:
                return [CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE];            
        }
    }
}
