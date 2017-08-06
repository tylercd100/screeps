
export class LinkManager {
    links: Link[];

    run(room: Room): void {
        let spawn = _.first(room.find<Spawn>(FIND_MY_SPAWNS));
        if(spawn) {
            let linkSpawn = spawn.pos.findClosestByRange<StructureLink>(FIND_STRUCTURES, {filter: (s: StructureLink) => s.structureType===STRUCTURE_LINK});
            let links = room.find(FIND_STRUCTURES, {filter: (s: Structure) => s.structureType === STRUCTURE_LINK && s.id !== linkSpawn.id});
        
            links.forEach((link: Link) => {
                link.transferEnergy(linkSpawn);
            });
        }
    }
}
