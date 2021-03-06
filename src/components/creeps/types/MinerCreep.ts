/*
* @Author: Tyler Arbon
* @Date:   2017-07-26 22:52:14
* @Last Modified by:   Tyler Arbon
* @Last Modified time: 2017-08-01 14:17:06
*/

'use strict';

import {Task, DepositIntoStockpileTask, BuildTask, HarvestTask} from "./../tasks/Tasks";
import {BaseCreep} from "./BaseCreep";
import {Nest} from "./../../nest/Nest";

export class MinerCreep extends BaseCreep {
    protected handle(task: Task): Task {
        let creep = this.creep;
        
        if(!task) {
            if(!creep.memory.working) {
                task = new HarvestTask(this.getClosestSource());
            } else {
                var site = this.getClosestConstructionSite();
                var container = this.getClosestStockpile();
                if(container) {
                    task = new DepositIntoStockpileTask(container, RESOURCE_ENERGY);
                } else if (site) {
                    task = new BuildTask(site);
                }
            }
        }

        return task;  
    }

    protected draw() {
        this.creep.room.visual.circle(this.creep.pos, {fill: 'transparent', radius: 0.55, stroke: 'blue'});
    }

    static type: string = "miner";

    static createCreep(spawn: Spawn, nest: Nest, level: number = 1): string|number|null {
        const body = MinerCreep.getBody(level);
        const name = MinerCreep.getName();
        const memory = MinerCreep.getMemory(nest);
        return spawn.createCreep(body, name, memory);
    }

    static getMemory(nest: Nest): {[key: string]: any} {
        return _.merge(BaseCreep.getMemory(nest), {
            type: MinerCreep.type,
        });
    }

    static getName(): string {
        return MinerCreep.type+"-"+BaseCreep.getName();
    }

    static getBody(level: number = 1): string[] {
        switch (level) {
            case 1: // 300
                return [WORK, WORK, CARRY, MOVE];
            case 2: // 550
                return [WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE];
            case 3: // 800
            case 4:
            default:
                return [WORK, WORK, WORK, WORK, WORK, WORK, CARRY, CARRY, MOVE, MOVE];
        }
    }
}
