// Fixtures use the production learning boundary; device preferences stay separate.
export async function seedState(page,input){
 await page.goto('/');
 await page.evaluate(async input=>{
  const {learningStorage,READING_KEY}=await import('/app/account-storage.js');
  const {voice='',readingHelpSeen=false,...learning}=input;
  learningStorage.setItem(READING_KEY,JSON.stringify({version:1,progress:{},readingList:[],words:[],pinyinScopes:['finals'],...learning}));
  await learningStorage.whenSaved();
  localStorage.setItem('reading-device-voice',voice);
  localStorage.setItem('reading-help-seen',String(readingHelpSeen));
 },input);
 await page.reload();
}
