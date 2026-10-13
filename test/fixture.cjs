module.exports = function fixture () {
  const flows = [
    {id:'flow',type:'tab',label:'Speed dial test'},
    {id:'base',type:'ui-base',name:'Test Dashboard',path:'/dashboard',includeClientData:true,acceptsClientConfig:['ui-speed-dial'],showPathInSidebar:false,headerContent:'page',navigationStyle:'default',titleBarStyle:'default'},
    {id:'theme',type:'ui-theme',name:'Test theme',colors:{surface:'#ffffff',primary:'#2563eb',bgPage:'#f5f5f5',groupBg:'#ffffff',groupOutline:'#cccccc'},sizes:{density:'default',pagePadding:'12px',groupGap:'12px',groupBorderRadius:'4px',widgetGap:'12px'}},
    {id:'page',type:'ui-page',name:'First',ui:'base',path:'/first',icon:'home',layout:'grid',theme:'theme',order:1,visible:true,disabled:false},
    {id:'page2',type:'ui-page',name:'Second',ui:'base',path:'/second',icon:'home',layout:'grid',theme:'theme',order:2,visible:true,disabled:false},
    {id:'group',type:'ui-group',name:'Other widgets',page:'page',width:6,height:5,order:1,showTitle:true,visible:true,disabled:false,groupType:'default'},
    {id:'ordinary',type:'ui-button',z:'flow',group:'group',name:'Ordinary',label:'Ordinary button',order:1,width:3,height:1,icon:'home',payload:'ordinary',payloadType:'str',topic:'',topicType:'str',enableClick:true,wires:[['debug']]},
    {id:'dial',type:'ui-speed-dial',z:'flow',name:'Test dial',page:'page',scope:'page',order:1,actions:[{id:'first',label:'First action',icon:'pi-check',payload:'first',payloadType:'str'},{id:'json',label:'JSON action',icon:'pi-star',payload:'{"ok":true}',payloadType:'json'}],button:{label:'Actions'},menu:{overlay:true},wires:[['debug']],x:360,y:100},
    {id:'debug',type:'debug',z:'flow',name:'speed dial output',active:true,tosidebar:true,console:false,tostatus:false,complete:'true',targetType:'full',wires:[],x:600,y:100}
  ]
  const ids = new Map(flows.map(n=>[n.id,'sd-test-'+n.id]))
  return flows.map(n=>{
    const copy={...n,id:ids.get(n.id)}
    for(const key of ['ui','theme','page','group','z']) if(ids.has(n[key])) copy[key]=ids.get(n[key])
    if(n.wires)copy.wires=n.wires.map(output=>output.map(id=>ids.get(id)||id))
    return copy
  })
}
