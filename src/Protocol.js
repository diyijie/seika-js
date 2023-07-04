class Protocol {}
Protocol.MASK_DELETE_ON_EXIT = 1 << 0;
Protocol.MASK_EXCLUSIVE = 1 << 1; 

Protocol.MEMORY = 'memory';
Protocol.DISK = 'disk';
Protocol.DB = 'db'; 

export default Protocol;