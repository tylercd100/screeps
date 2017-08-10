/*
* @Author: Tyler Arbon
* @Date:   2017-08-09 18:05:37
* @Last Modified by:   Tyler
* @Last Modified time: 2017-08-09 21:50:08
*/

'use strict';

export interface SerialRaw {
	class: string;
	data: any;
}

export abstract class Serializable {
	abstract serialize(): SerialRaw;
}