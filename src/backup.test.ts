import {beforeEach,describe,it,expect,vi} from 'vitest';
import {initialState,validateState} from './domain';
const native=vi.hoisted(()=>({enabled:false,write:vi.fn(),share:vi.fn()}));
vi.mock('@capacitor/core',()=>({Capacitor:{isNativePlatform:()=>native.enabled}}));
vi.mock('@capacitor/filesystem',()=>({Filesystem:{writeFile:native.write},Directory:{Cache:'CACHE'},Encoding:{UTF8:'utf8'}}));
vi.mock('@capacitor/share',()=>({Share:{share:native.share}}));
import {exportBackup} from './backup';
import {shouldRegisterServiceWorker} from './platform';
beforeEach(()=>{vi.clearAllMocks();native.enabled=true;native.write.mockResolvedValue({uri:'file:///cache/backup.json'});native.share.mockResolvedValue({activityType:''});});
describe('native backup and web runtime separation',()=>{
 it('shares a restorable backup from app-private cache',async()=>{const s=initialState();s.trainingCycle={dayId:'P2',completedParts:['upper']};expect(await exportBackup(s)).toBe('shared');const file=native.write.mock.calls[0][0];expect(file.directory).toBe('CACHE');expect(file.encoding).toBe('utf8');expect(validateState(JSON.parse(file.data))).toEqual(s);expect(native.share).toHaveBeenCalledWith(expect.objectContaining({files:['file:///cache/backup.json']}));});
 it('does not share when writing the file fails',async()=>{native.write.mockRejectedValueOnce(new Error('disk full'));await expect(exportBackup(initialState())).rejects.toThrow('disk full');expect(native.share).not.toHaveBeenCalled();});
 it('propagates share cancellation/failure so the UI cannot claim a saved backup',async()=>{native.share.mockRejectedValueOnce(new Error('cancelled'));await expect(exportBackup(initialState())).rejects.toThrow('cancelled');});
 it('only registers the offline worker on production web',()=>{expect(shouldRegisterServiceWorker(true)).toBe(false);native.enabled=false;expect(shouldRegisterServiceWorker(true)).toBe(true);expect(shouldRegisterServiceWorker(false)).toBe(false);});
});
