/*
* @Author: Tyler
* @Date:   2017-08-08 22:23:12
* @Last Modified by:   Tyler
* @Last Modified time: 2017-08-08 22:34:32
*/

'use strict';

export class Contruct {
	_level: number;
	_cost: number;
	_name: string;
	body: string[];
	type: string;
	
	get cost(): number {
	    return this._cost;
	}
    set cost(cost: number) {
        cost;
    }
}