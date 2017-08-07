/*
* @Author: Tyler Arbon
* @Date:   2017-07-26 22:52:14
* @Last Modified by:   Tyler Arbon
* @Last Modified time: 2017-08-06 11:41:47
*/

'use strict';

import {Task, GotoRoomTask, ReserveTask} from "./../tasks/Tasks";
import {BaseCreep} from "./BaseCreep";
import * as Config from "./../../../config/config";
import {Nest} from "./../../nest/Nest";

export class ReserverCreep extends BaseCreep {
    protected handle(task: Task): Task {

        let creep = this.creep;

        if(!task) {

            let target = creep.memory.station;

            if(target) {
                if (creep.room.name === target) {
                    if(creep.room.controller) {
                        task = new ReserveTask(creep.room.controller)
                    } else {
                        task = this.gotoRally();
                    }
                } else {
                    task = new GotoRoomTask(target);
                }
            }
        }

        return task;
    }

    protected draw() {
        this.creep.room.visual.circle(this.creep.pos, {fill: 'transparent', radius: 0.55, stroke: 'lime'});
    }

    static type: string = "reserver";

    static createCreep(spawn: Spawn, nest: Nest, level: number = 1): string|number|null {
        const body = ReserverCreep.getBody(level);
        const name = ReserverCreep.getName();
        const memory = ReserverCreep.getMemory(nest);
        return spawn.createCreep(body, name, memory);
    }

    static getMemory(nest: Nest): {[key: string]: any} {
        return _.merge(BaseCreep.getMemory(nest), {
            type: ReserverCreep.type,
        });
    }

    static getName(): string {
        return ReserverCreep.type+"-"+BaseCreep.getName();
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
            case 2: // 550
            case 3: // 800
            case 4:
            default:
                return [CLAIM, MOVE, MOVE];
        }
    }
}
