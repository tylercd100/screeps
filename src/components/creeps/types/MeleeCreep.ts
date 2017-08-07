/*
* @Author: Tyler Arbon
* @Date:   2017-07-26 22:52:14
* @Last Modified by:   Tyler Arbon
* @Last Modified time: 2017-08-06 11:41:04
*/

'use strict';

import {Task, GotoRoomTask, AttackTask, GotoTargetTask} from "./../tasks/Tasks";
import {BaseCreep} from "./BaseCreep";
import * as Config from "./../../../config/config";
import {Nest} from "./../../nest/Nest";

export class MeleeCreep extends BaseCreep {
    protected handle(task: Task): Task {

        let creep = this.creep;

        let station = creep.memory.station

        if(station) {
            if (creep.room.name === station) {

                let enemyCreep = creep.pos.findClosestByRange<Creep>(FIND_HOSTILE_CREEPS, {
                    filter: function (creep: Creep) {
                        return _.indexOf(Config.FRIENDS, creep.owner.username) < 0;
                    }
                })

                let enemySpawn = creep.pos.findClosestByRange<Spawn>(FIND_HOSTILE_SPAWNS);

                if ((enemyCreep || enemySpawn) && _.get(creep, "room.controller.safeMode", 0) === 0) {
                    if(enemySpawn) {
                        task = new AttackTask(enemySpawn);
                    } else if (enemyCreep) {
                        task = new AttackTask(enemyCreep);
                    }
                } else if(!task) {
                    task = this.gotoRally();
                }
            } else if(!task) {
                task = new GotoRoomTask(station);
            }
        }

        return task;
    }

    protected draw() {
        this.creep.room.visual.circle(this.creep.pos, {fill: 'transparent', radius: 0.55, stroke: 'red'});
    }

    static type: string = "melee";

    static createCreep(spawn: Spawn, nest: Nest, level: number = 1): string|number|null {
        const body = MeleeCreep.getBody(level);
        const name = MeleeCreep.getName();
        const memory = MeleeCreep.getMemory(nest);
        return spawn.createCreep(body, name, memory);
    }

    static getMemory(nest: Nest): {[key: string]: any} {
        return _.merge(BaseCreep.getMemory(nest), {
            type: MeleeCreep.type,
        });
    }

    static getName(): string {
        return MeleeCreep.type+"-"+BaseCreep.getName();
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
                return [ATTACK, ATTACK, MOVE, MOVE, TOUGH, TOUGH, TOUGH, TOUGH];
            case 2: // 550
            case 3: // 800
            case 4:
            default:
                return [ATTACK, ATTACK, ATTACK, ATTACK, MOVE, MOVE, MOVE, MOVE, TOUGH, TOUGH, TOUGH];
        }
    }
}
