/*
* @Author: Tyler Arbon
* @Date:   2017-07-26 22:52:14
* @Last Modified by:   Tyler Arbon
* @Last Modified time: 2017-08-04 09:54:39
*/

'use strict';

import {Task, GotoRoomTask, GotoTargetTask} from "./../tasks/Tasks";
import {BaseCreep} from "./BaseCreep";
import {Nest} from "./../../nest/Nest";

export class ScoutCreep extends BaseCreep {
    protected handle(task: Task): Task {

        let creep = this.creep;

        if(!task) {
            let station = creep.memory.station

            if(station) {
                if (creep.room.name === station) {
                    let target: Flag|Spawn = this.getFlag("Rally");
                    if(!target) {
                        target = this.getClosestSpawn()
                    }

                    if(target) {
                        if(target.pos.getRangeTo(creep.pos) > 2) {
                            task = new GotoTargetTask(target)
                        }
                    } else {
                        creep.move(creep.pos.getDirectionTo(24, 24));
                    }
                } else {
                    task = new GotoRoomTask(station);
                }
            }
        }

        return task;
    }

    protected draw() {
        this.creep.room.visual.circle(this.creep.pos, {fill: 'transparent', radius: 0.55, stroke: 'white'});
    }

    static type: string = "scout";

    static createCreep(spawn: Spawn, nest: Nest, level: number = 1): string|number|null {
        const body = ScoutCreep.getBody(level);
        const name = ScoutCreep.getName();
        const memory = ScoutCreep.getMemory(nest);
        return spawn.createCreep(body, name, memory);
    }

    static getMemory(nest: Nest): {[key: string]: any} {
        return _.merge(BaseCreep.getMemory(nest), {
            type: ScoutCreep.type,
        });
    }

    static getName(): string {
        return ScoutCreep.type+"-"+BaseCreep.getName();
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
                return [MOVE,MOVE,MOVE,MOVE,MOVE,MOVE];
        }
    }
}
