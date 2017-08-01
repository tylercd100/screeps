/*
* @Author: Tyler Arbon
* @Date:   2017-07-26 22:52:14
* @Last Modified by:   Tyler Arbon
* @Last Modified time: 2017-07-31 16:51:28
*/

'use strict';

import {Task, WithdrawFromStockpileTask, HarvestTask, GotoTargetTask, FillWithEnergyTask} from "./../tasks/Tasks";
import {BaseCreep} from "./BaseCreep";

export class EnergizerCreep extends BaseCreep {
    protected handle(task: Task): Task {

        let creep = this.creep;
        let spawn = this.getClosestSpawn();
        let containers = this.getStockpiles();
        let stockpileSpawn: StructureContainer|StructureStorage = this.getSpawnStockpile(spawn);

        if(!task) {
            if(!creep.memory.working) {

                if (containers.length === 0) {
                    task = new HarvestTask(this.getClosestSource());
                } else if (stockpileSpawn) {
                    task = new WithdrawFromStockpileTask(stockpileSpawn, RESOURCE_ENERGY);
                } else {
                    let spawn = this.getClosestSpawn();
                    task = new GotoTargetTask(spawn);
                }
            } else {
                let fillable;
                if(creep.room.energyAvailable < 300) {
                    fillable = this.getClosestSpawn();
                } else {
                    let tower = this.getClosestTower();
                    if((tower.energy < 300 && creep.carryCapacity > 150) || tower.energy < 25) {
                        fillable = tower;
                    } else {
                        fillable = this.getClosestFillable()
                    }
                }

                if(fillable) {
                    task = new FillWithEnergyTask(fillable);
                } else {
                    this.setSleep(25);
                }
            }
        }

        return task;
    }

    protected draw() {
        this.creep.room.visual.circle(this.creep.pos, {fill: 'transparent', radius: 0.55, stroke: 'yellow'});
    }

    static type: string = "energizer";

    static createCreep(room: Room, level: number): string|number|null {
        const spawn = EnergizerCreep.getSpawn(room);
        const body = EnergizerCreep.getBody(room, level);
        const name = EnergizerCreep.getName();
        const memory = EnergizerCreep.getMemory(room);
        return spawn.createCreep(body, name, memory);
    }

    static getMemory(room: Room): {[key: string]: any} {
        return _.merge(BaseCreep.getMemory(room), {
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
    static getBody(room: Room, level: number): string[] {
        switch (level) {
            case 1: // 300
                return [WORK, CARRY, CARRY, CARRY, MOVE];
            case 2: // 550
                return [WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE];
            case 3: // 800
            case 4:
            default:
                return [WORK, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, CARRY, MOVE, MOVE, MOVE];
        }
    }
}
