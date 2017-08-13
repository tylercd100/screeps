/*
* @Author: Tyler Arbon
* @Date:   2017-08-09 18:05:37
* @Last Modified by:   Tyler Arbon
* @Last Modified time: 2017-08-11 17:23:38
*/

'use strict';

export interface SerialRaw {
	class: string;
	data: any;
}

export abstract class Serializable {
	abstract toString(): string;
	abstract serialize(): SerialRaw;
}