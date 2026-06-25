(function(){var e=class{constructor(e,t=(e,t)=>fetch(e,t)){this.token=e,this.doFetch=t}async state(){try{let e=await(await this.doFetch(`/api/state`)).json();return{entries:e.entries??[],discovered:e.discovered??[]}}catch{return{entries:[],discovered:[]}}}async post(e,t={}){let n=await this.doFetch(`/api/${e}`,{method:`POST`,headers:{"Content-Type":`application/json`,"X-Dod-Token":this.token},body:JSON.stringify(t)});if(n.status===403)return{ok:!1,error:`forbidden`,detail:`token rotated`};try{return await n.json()}catch{return{}}}},t=globalThis,n=t.ShadowRoot&&(t.ShadyCSS===void 0||t.ShadyCSS.nativeShadow)&&`adoptedStyleSheets`in Document.prototype&&`replace`in CSSStyleSheet.prototype,r=Symbol(),i=new WeakMap,a=class{constructor(e,t,n){if(this._$cssResult$=!0,n!==r)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o,t=this.t;if(n&&e===void 0){let n=t!==void 0&&t.length===1;n&&(e=i.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),n&&i.set(t,e))}return e}toString(){return this.cssText}},o=e=>new a(typeof e==`string`?e:e+``,void 0,r),s=(e,r)=>{if(n)e.adoptedStyleSheets=r.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let n of r){let r=document.createElement(`style`),i=t.litNonce;i!==void 0&&r.setAttribute(`nonce`,i),r.textContent=n.cssText,e.appendChild(r)}},c=n?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t=``;for(let n of e.cssRules)t+=n.cssText;return o(t)})(e):e,{is:l,defineProperty:u,getOwnPropertyDescriptor:d,getOwnPropertyNames:f,getOwnPropertySymbols:p,getPrototypeOf:ee}=Object,m=globalThis,te=m.trustedTypes,ne=te?te.emptyScript:``,re=m.reactiveElementPolyfillSupport,h=(e,t)=>e,g={toAttribute(e,t){switch(t){case Boolean:e=e?ne:null;break;case Object:case Array:e=e==null?e:JSON.stringify(e)}return e},fromAttribute(e,t){let n=e;switch(t){case Boolean:n=e!==null;break;case Number:n=e===null?null:Number(e);break;case Object:case Array:try{n=JSON.parse(e)}catch{n=null}}return n}},_=(e,t)=>!l(e,t),ie={attribute:!0,type:String,converter:g,reflect:!1,useDefault:!1,hasChanged:_};Symbol.metadata??=Symbol(`metadata`),m.litPropertyMetadata??=new WeakMap;var v=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=ie){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){let n=Symbol(),r=this.getPropertyDescriptor(e,n,t);r!==void 0&&u(this.prototype,e,r)}}static getPropertyDescriptor(e,t,n){let{get:r,set:i}=d(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:r,set(t){let a=r?.call(this);i?.call(this,t),this.requestUpdate(e,a,n)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??ie}static _$Ei(){if(this.hasOwnProperty(h(`elementProperties`)))return;let e=ee(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(h(`finalized`)))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(h(`properties`))){let e=this.properties,t=[...f(e),...p(e)];for(let n of t)this.createProperty(n,e[n])}let e=this[Symbol.metadata];if(e!==null){let t=litPropertyMetadata.get(e);if(t!==void 0)for(let[e,n]of t)this.elementProperties.set(e,n)}this._$Eh=new Map;for(let[e,t]of this.elementProperties){let n=this._$Eu(e,t);n!==void 0&&this._$Eh.set(n,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let t=[];if(Array.isArray(e)){let n=new Set(e.flat(1/0).reverse());for(let e of n)t.unshift(c(e))}else e!==void 0&&t.push(c(e));return t}static _$Eu(e,t){let n=t.attribute;return!1===n?void 0:typeof n==`string`?n:typeof e==`string`?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,t=this.constructor.elementProperties;for(let n of t.keys())this.hasOwnProperty(n)&&(e.set(n,this[n]),delete this[n]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return s(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,n){this._$AK(e,n)}_$ET(e,t){let n=this.constructor.elementProperties.get(e),r=this.constructor._$Eu(e,n);if(r!==void 0&&!0===n.reflect){let i=(n.converter?.toAttribute===void 0?g:n.converter).toAttribute(t,n.type);this._$Em=e,i==null?this.removeAttribute(r):this.setAttribute(r,i),this._$Em=null}}_$AK(e,t){let n=this.constructor,r=n._$Eh.get(e);if(r!==void 0&&this._$Em!==r){let e=n.getPropertyOptions(r),i=typeof e.converter==`function`?{fromAttribute:e.converter}:e.converter?.fromAttribute===void 0?g:e.converter;this._$Em=r;let a=i.fromAttribute(t,e.type);this[r]=a??this._$Ej?.get(r)??a,this._$Em=null}}requestUpdate(e,t,n,r=!1,i){if(e!==void 0){let a=this.constructor;if(!1===r&&(i=this[e]),n??=a.getPropertyOptions(e),!((n.hasChanged??_)(i,t)||n.useDefault&&n.reflect&&i===this._$Ej?.get(e)&&!this.hasAttribute(a._$Eu(e,n))))return;this.C(e,t,n)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:n,reflect:r,wrapped:i},a){n&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,a??t??this[e]),!0!==i||a!==void 0)||(this._$AL.has(e)||(this.hasUpdated||n||(t=void 0),this._$AL.set(e,t)),!0===r&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}let e=this.constructor.elementProperties;if(e.size>0)for(let[t,n]of e){let{wrapped:e}=n,r=this[t];!0!==e||this._$AL.has(t)||r===void 0||this.C(t,void 0,n,r)}}let e=!1,t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};v.elementStyles=[],v.shadowRootOptions={mode:`open`},v[h(`elementProperties`)]=new Map,v[h(`finalized`)]=new Map,re?.({ReactiveElement:v}),(m.reactiveElementVersions??=[]).push(`2.1.2`);var y=globalThis,ae=e=>e,b=y.trustedTypes,oe=b?b.createPolicy(`lit-html`,{createHTML:e=>e}):void 0,se=`$lit$`,x=`lit$${Math.random().toFixed(9).slice(2)}$`,ce=`?`+x,le=`<${ce}>`,S=document,C=()=>S.createComment(``),w=e=>e===null||typeof e!=`object`&&typeof e!=`function`,T=Array.isArray,ue=e=>T(e)||typeof e?.[Symbol.iterator]==`function`,E=`[ 	
\f\r]`,D=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,de=/-->/g,fe=/>/g,O=RegExp(`>|${E}(?:([^\\s"'>=/]+)(${E}*=${E}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,`g`),pe=/'/g,me=/"/g,he=/^(?:script|style|textarea|title)$/i,ge=e=>(t,...n)=>({_$litType$:e,strings:t,values:n}),k=ge(1),A=ge(2),j=Symbol.for(`lit-noChange`),M=Symbol.for(`lit-nothing`),_e=new WeakMap,N=S.createTreeWalker(S,129);function ve(e,t){if(!T(e)||!e.hasOwnProperty(`raw`))throw Error(`invalid template strings array`);return oe===void 0?t:oe.createHTML(t)}var ye=(e,t)=>{let n=e.length-1,r=[],i,a=t===2?`<svg>`:t===3?`<math>`:``,o=D;for(let t=0;t<n;t++){let n=e[t],s,c,l=-1,u=0;for(;u<n.length&&(o.lastIndex=u,c=o.exec(n),c!==null);)u=o.lastIndex,o===D?c[1]===`!--`?o=de:c[1]===void 0?c[2]===void 0?c[3]!==void 0&&(o=O):(he.test(c[2])&&(i=RegExp(`</`+c[2],`g`)),o=O):o=fe:o===O?c[0]===`>`?(o=i??D,l=-1):c[1]===void 0?l=-2:(l=o.lastIndex-c[2].length,s=c[1],o=c[3]===void 0?O:c[3]===`"`?me:pe):o===me||o===pe?o=O:o===de||o===fe?o=D:(o=O,i=void 0);let d=o===O&&e[t+1].startsWith(`/>`)?` `:``;a+=o===D?n+le:l>=0?(r.push(s),n.slice(0,l)+se+n.slice(l)+x+d):n+x+(l===-2?t:d)}return[ve(e,a+(e[n]||`<?>`)+(t===2?`</svg>`:t===3?`</math>`:``)),r]},P=class e{constructor({strings:t,_$litType$:n},r){let i;this.parts=[];let a=0,o=0,s=t.length-1,c=this.parts,[l,u]=ye(t,n);if(this.el=e.createElement(l,r),N.currentNode=this.el.content,n===2||n===3){let e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;(i=N.nextNode())!==null&&c.length<s;){if(i.nodeType===1){if(i.hasAttributes())for(let e of i.getAttributeNames())if(e.endsWith(se)){let t=u[o++],n=i.getAttribute(e).split(x),r=/([.?@])?(.*)/.exec(t);c.push({type:1,index:a,name:r[2],strings:n,ctor:r[1]===`.`?xe:r[1]===`?`?Se:r[1]===`@`?Ce:L}),i.removeAttribute(e)}else e.startsWith(x)&&(c.push({type:6,index:a}),i.removeAttribute(e));if(he.test(i.tagName)){let e=i.textContent.split(x),t=e.length-1;if(t>0){i.textContent=b?b.emptyScript:``;for(let n=0;n<t;n++)i.append(e[n],C()),N.nextNode(),c.push({type:2,index:++a});i.append(e[t],C())}}}else if(i.nodeType===8)if(i.data===ce)c.push({type:2,index:a});else{let e=-1;for(;(e=i.data.indexOf(x,e+1))!==-1;)c.push({type:7,index:a}),e+=x.length-1}a++}}static createElement(e,t){let n=S.createElement(`template`);return n.innerHTML=e,n}};function F(e,t,n=e,r){if(t===j)return t;let i=r===void 0?n._$Cl:n._$Co?.[r],a=w(t)?void 0:t._$litDirective$;return i?.constructor!==a&&(i?._$AO?.(!1),a===void 0?i=void 0:(i=new a(e),i._$AT(e,n,r)),r===void 0?n._$Cl=i:(n._$Co??=[])[r]=i),i!==void 0&&(t=F(e,i._$AS(e,t.values),i,r)),t}var be=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:t},parts:n}=this._$AD,r=(e?.creationScope??S).importNode(t,!0);N.currentNode=r;let i=N.nextNode(),a=0,o=0,s=n[0];for(;s!==void 0;){if(a===s.index){let t;s.type===2?t=new I(i,i.nextSibling,this,e):s.type===1?t=new s.ctor(i,s.name,s.strings,this,e):s.type===6&&(t=new we(i,this,e)),this._$AV.push(t),s=n[++o]}a!==s?.index&&(i=N.nextNode(),a++)}return N.currentNode=S,r}p(e){let t=0;for(let n of this._$AV)n!==void 0&&(n.strings===void 0?n._$AI(e[t]):(n._$AI(e,n,t),t+=n.strings.length-2)),t++}},I=class e{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,n,r){this.type=2,this._$AH=M,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=n,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=F(this,e,t),w(e)?e===M||e==null||e===``?(this._$AH!==M&&this._$AR(),this._$AH=M):e!==this._$AH&&e!==j&&this._(e):e._$litType$===void 0?e.nodeType===void 0?ue(e)?this.k(e):this._(e):this.T(e):this.$(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==M&&w(this._$AH)?this._$AA.nextSibling.data=e:this.T(S.createTextNode(e)),this._$AH=e}$(e){let{values:t,_$litType$:n}=e,r=typeof n==`number`?this._$AC(e):(n.el===void 0&&(n.el=P.createElement(ve(n.h,n.h[0]),this.options)),n);if(this._$AH?._$AD===r)this._$AH.p(t);else{let e=new be(r,this),n=e.u(this.options);e.p(t),this.T(n),this._$AH=e}}_$AC(e){let t=_e.get(e.strings);return t===void 0&&_e.set(e.strings,t=new P(e)),t}k(t){T(this._$AH)||(this._$AH=[],this._$AR());let n=this._$AH,r,i=0;for(let a of t)i===n.length?n.push(r=new e(this.O(C()),this.O(C()),this,this.options)):r=n[i],r._$AI(a),i++;i<n.length&&(this._$AR(r&&r._$AB.nextSibling,i),n.length=i)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){let t=ae(e).nextSibling;ae(e).remove(),e=t}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},L=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,n,r,i){this.type=1,this._$AH=M,this._$AN=void 0,this.element=e,this.name=t,this._$AM=r,this.options=i,n.length>2||n[0]!==``||n[1]!==``?(this._$AH=Array(n.length-1).fill(new String),this.strings=n):this._$AH=M}_$AI(e,t=this,n,r){let i=this.strings,a=!1;if(i===void 0)e=F(this,e,t,0),a=!w(e)||e!==this._$AH&&e!==j,a&&(this._$AH=e);else{let r=e,o,s;for(e=i[0],o=0;o<i.length-1;o++)s=F(this,r[n+o],t,o),s===j&&(s=this._$AH[o]),a||=!w(s)||s!==this._$AH[o],s===M?e=M:e!==M&&(e+=(s??``)+i[o+1]),this._$AH[o]=s}a&&!r&&this.j(e)}j(e){e===M?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??``)}},xe=class extends L{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===M?void 0:e}},Se=class extends L{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==M)}},Ce=class extends L{constructor(e,t,n,r,i){super(e,t,n,r,i),this.type=5}_$AI(e,t=this){if((e=F(this,e,t,0)??M)===j)return;let n=this._$AH,r=e===M&&n!==M||e.capture!==n.capture||e.once!==n.once||e.passive!==n.passive,i=e!==M&&(n===M||r);r&&this.element.removeEventListener(this.name,this,n),i&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH==`function`?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},we=class{constructor(e,t,n){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=n}get _$AU(){return this._$AM._$AU}_$AI(e){F(this,e)}},Te=y.litHtmlPolyfillSupport;Te?.(P,I),(y.litHtmlVersions??=[]).push(`3.3.3`);var Ee=(e,t,n)=>{let r=n?.renderBefore??t,i=r._$litPart$;if(i===void 0){let e=n?.renderBefore??null;r._$litPart$=i=new I(t.insertBefore(C(),e),e,void 0,n??{})}return i._$AI(e),i},R=globalThis,z=class extends v{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=Ee(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return j}};z._$litElement$=!0,z.finalized=!0,R.litElementHydrateSupport?.({LitElement:z});var De=R.litElementPolyfillSupport;De?.({LitElement:z}),(R.litElementVersions??=[]).push(`4.2.2`);var B=e=>(t,n)=>{n===void 0?customElements.define(e,t):n.addInitializer(()=>{customElements.define(e,t)})},Oe={attribute:!0,type:String,converter:g,reflect:!1,hasChanged:_},ke=(e=Oe,t,n)=>{let{kind:r,metadata:i}=n,a=globalThis.litPropertyMetadata.get(i);if(a===void 0&&globalThis.litPropertyMetadata.set(i,a=new Map),r===`setter`&&((e=Object.create(e)).wrapped=!0),a.set(n.name,e),r===`accessor`){let{name:r}=n;return{set(n){let i=t.get.call(this);t.set.call(this,n),this.requestUpdate(r,i,e,!0,n)},init(t){return t!==void 0&&this.C(r,void 0,e,t),t}}}if(r===`setter`){let{name:r}=n;return function(n){let i=this[r];t.call(this,n),this.requestUpdate(r,i,e,!0,n)}}throw Error(`Unsupported decorator location: `+r)};function V(e){return(t,n)=>typeof n==`object`?ke(e,t,n):((e,t,n)=>{let r=t.hasOwnProperty(n);return t.constructor.createProperty(n,e),r?Object.getOwnPropertyDescriptor(t,n):void 0})(e,t,n)}function H(e){return V({...e,state:!0,attribute:!1})}var Ae={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},je=e=>(...t)=>({_$litDirective$:e,values:t}),Me=class{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,t,n){this._$Ct=e,this._$AM=t,this._$Ci=n}_$AS(e,t){return this.update(e,t)}update(e,t){return this.render(...t)}},U=class extends Me{constructor(e){if(super(e),this.it=M,e.type!==Ae.CHILD)throw Error(this.constructor.directiveName+`() can only be used in child bindings`)}render(e){if(e===M||e==null)return this._t=void 0,this.it=e;if(e===j)return e;if(typeof e!=`string`)throw Error(this.constructor.directiveName+`() called with a non-string value`);if(e===this.it)return this._t;this.it=e;let t=[e];return t.raw=t,this._t={_$litType$:this.constructor.resultType,strings:t,values:[]}}};U.directiveName=`unsafeHTML`,U.resultType=1;var Ne=je(U),Pe=[`var(--dk-c1)`,`var(--dk-c2)`,`var(--dk-c3)`,`var(--dk-c4)`,`var(--dk-c5)`,`var(--dk-c6)`],W=e=>Pe[((Number(e)||0)%6+6)%6];function G(e){return e==null?`–`:typeof e==`number`?Number.isFinite(e)?Number.isInteger(e)?e.toLocaleString():Math.abs(e)>=1e3?e.toLocaleString(void 0,{maximumFractionDigits:1}):e.toFixed(2):`–`:String(e)}function Fe(e){let t=Number(e)||0,n=Math.abs(t);return n>=1e9?`${(t/1e9).toFixed(1)}B`:n>=1e6?`${(t/1e6).toFixed(1)}M`:n>=1e3?`${(t/1e3).toFixed(1)}k`:Number.isInteger(t)?String(t):t.toFixed(2)}function Ie(e){return typeof e==`string`&&/^\d{4}-\d{2}-\d{2}/.test(e)?e.slice(0,10):String(e)}function Le(e,t){let n=String(e);return n.length>t?`${n.slice(0,t-1)}…`:n}function Re(e,t){let n=e.length,r=e.filter(e=>e!=null&&Number.isFinite(e));if(r.length<2)return k`<svg viewBox="0 0 ${240} ${46}"></svg>`;let i=Math.min(...r),a=Math.max(...r)-i||1,o=e=>4+e/(n-1)*232,s=e=>42-(e-i)/a*38,c=``,l=!1;return e.forEach((e,t)=>{if(e==null||!Number.isFinite(e)){l=!1;return}c+=`${l?`L`:`M`}${o(t).toFixed(1)},${s(e).toFixed(1)} `,l=!0}),k`<svg viewBox="0 0 ${240} ${46}" preserveAspectRatio="none">
    <path d=${c} fill="none" stroke=${t} stroke-width="1.6"></path>
  </svg>`}var ze=e=>e===`accent`?`var(--dk-accent)`:e===`err`?`var(--dk-err)`:e===`ok`?`var(--dk-ok)`:`var(--dk-muted)`;function Be(e,t,n,r){let i={l:60,r:14,t:22,b:72},a=820-i.l-i.r,o=340-i.t-i.b,s=t.length,c=n.length>1,l=0;if(e===`stacked`)for(let e=0;e<s;e++){let t=0;n.forEach(n=>{t+=Math.max(0,Number(n.values[e])||0)}),l=Math.max(l,t)}else n.forEach(e=>e.values.forEach(e=>{l=Math.max(l,Number(e)||0)}));l||=1;let u=e=>i.t+o-e/l*o,d=a/Math.max(1,s),f=e=>i.l+d*e+d/2,p=[];for(let e=0;e<=4;e++){let t=l*e/4,n=u(t);p.push(A`<line class="dk-grid" x1=${i.l} y1=${n} x2=${i.l+a} y2=${n}></line>
      <text class="dk-tick" x=${i.l-8} y=${n+4} text-anchor="end">${Fe(t)}</text>`)}let ee=s>18?Math.ceil(s/18):1;for(let e=0;e<s;e++){if(e%ee)continue;let n=f(e),r=i.t+o+15;p.push(A`<text class="dk-tick" x=${n} y=${r} text-anchor="end" transform=${`rotate(-35 ${n} ${r})`}>${Le(Ie(t[e]),18)}</text>`)}if(e===`bar`||e===`stacked`){let t=n.length;if(e===`stacked`)for(let e=0;e<s;e++){let t=0;n.forEach((n,r)=>{let i=Math.max(0,Number(n.values[e])||0),a=u(t),o=u(t+i);t+=i;let s=d*.7;p.push(A`<rect x=${f(e)-s/2} y=${o} width=${s} height=${Math.max(0,a-o)} fill=${W(r)}></rect>`)})}else{let e=d*.72,r=c?e/t:e;for(let t=0;t<s;t++)n.forEach((n,a)=>{let s=u(Math.max(0,Number(n.values[t])||0)),l=c?f(t)-e/2+a*r:f(t)-e/2;p.push(A`<rect x=${l} y=${s} width=${Math.max(1,r-(c?1.5:0))} height=${Math.max(0,i.t+o-s)} fill=${W(c?a:0)}></rect>`)})}}else n.forEach((t,n)=>{let r=t.values.map((e,t)=>`${f(t)},${u(Math.max(0,Number(e)||0))}`).join(` `);e===`area`&&!c&&p.push(A`<polygon points=${`${f(0)},${i.t+o} ${r} ${f(s-1)},${i.t+o}`} fill=${W(0)} opacity=".18"></polygon>`),p.push(A`<polyline points=${r} fill="none" stroke=${W(n)} stroke-width="2"></polyline>`),t.values.forEach((e,t)=>p.push(A`<circle cx=${f(t)} cy=${u(Math.max(0,Number(e)||0))} r="2.6" fill=${W(n)}></circle>`))});return p.push(A`<line class="dk-axis" x1=${i.l} y1=${i.t+o} x2=${i.l+a} y2=${i.t+o}></line>
    <line class="dk-axis" x1=${i.l} y1=${i.t} x2=${i.l} y2=${i.t+o}></line>`),(r??[]).forEach(e=>{let n=t.indexOf(e.x);if(n<0)return;let r=f(n),a=ze(e.tone);p.push(A`<line x1=${r} y1=${i.t} x2=${r} y2=${i.t+o} stroke=${a} stroke-width="1" stroke-dasharray="3 3" opacity=".85"></line>`),e.label&&p.push(A`<text x=${r} y=${i.t-6} text-anchor="middle" class="dk-tick" fill=${a}>${e.label}</text>`)}),k`<svg viewBox="0 0 ${820} ${340}">${p}</svg>${c?k`<div class="dk-legend">
        ${n.map((e,t)=>k`<span><i style="background:${W(t)}"></i>${e.name??``}</span>`)}
      </div>`:``}`}function Ve(e,t,n,r){let i={l:140,r:70,t:8,b:20},a=e.length,o=i.t+i.b+a*30,s=820-i.l-i.r,c=i.l+s/2,l=s/2,u=[A`<line class="dk-axis" x1=${c} y1=${i.t} x2=${c} y2=${i.t+a*30}></line>`];return t.forEach((t,n)=>{let r=Math.max(-1,Math.min(1,Number(t)||0)),a=i.t+n*30,o=Math.abs(r)*l,s=r>=0?c:c-o,d=r>=0?`var(--dk-c1)`:`var(--dk-c2)`;u.push(A`<text class="dk-tick" x=${i.l-10} y=${a+30/2+4} text-anchor="end">${Le(e[n],20)}</text>
      <rect x=${s} y=${a+5} width=${Math.max(1,o)} height=${18} rx="2" fill=${d}></rect>
      <text class="dk-cval" x=${r>=0?c+o+6:c-o-6} y=${a+30/2+4} text-anchor=${r>=0?`start`:`end`}>${r>0?`+`:``}${r.toFixed(2)}</text>`)}),u.push(A`<text class="dk-tick" x=${i.l} y=${i.t+a*30+14} text-anchor="start">← ${n??`them`}</text>
    <text class="dk-tick" x=${i.l+s} y=${i.t+a*30+14} text-anchor="end">${r??`you`} →</text>`),k`<svg viewBox="0 0 ${820} ${o}">${u}</svg>`}function He(e,t){let n={l:210,r:64,t:6,b:6},r=e.length,i=n.t+n.b+r*22,a=820-n.l-n.r,o=Math.max(...t.map(e=>Number(e)||0),0)||1,s=[];return t.forEach((t,r)=>{let i=n.t+r*22,c=Math.max(0,(Number(t)||0)/o*a);s.push(A`<text class="dk-tick" x=${n.l-8} y=${i+22/2+4} text-anchor="end">${Le(Ie(e[r]),30)}</text>
      <rect x=${n.l} y=${i+3} width=${c} height=${16} fill=${W(0)}></rect>
      <text class="dk-cval" x=${n.l+c+6} y=${i+22/2+4}>${Fe(Number(t)||0)}</text>`)}),k`<svg viewBox="0 0 ${820} ${i}">${s}</svg>`}function Ue(e){let t=e.kind??`line`,n=e.series??(e.values?[{name:e.label??``,values:e.values}]:[]),r=e.x??(n[0]?n[0].values.map((e,t)=>t):[]),i=n[0]?.values??[],a;return a=t===`spark`?Re(i,W(e.color??0)):t===`diverging`?Ve(r,i,e.left,e.right):t===`hbar`?He(r,i):Be(t===`bars`?`bar`:t===`stacked`?`stacked`:t===`area`?`area`:`line`,r,n,e.markers),k`<div class="dk-panel dk-chart ${t===`spark`?``:`dk-full`}">
    ${e.title?k`<div class="dk-l">${e.title}</div>`:``}${a}
  </div>`}function K(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a}var q=class extends z{constructor(...e){super(...e),this.panel={type:`form`},this.values={},this.dirty=!1}createRenderRoot(){return this}willUpdate(e){if(e.has(`panel`)&&!this.dirty){let e={};for(let t of this.panel.fields??[])e[t.key]=t.value??(t.kind===`checkbox`?!1:``);this.values=e}}set(e,t){this.values={...this.values,[e]:t},this.dirty=!0}field(e){let t=this.values[e.key],n=k`<span class="dk-fl">${e.label??e.key}</span>`;return e.kind===`textarea`?k`<label class="dk-f dk-full"
        >${n}<textarea
          .value=${t==null?``:String(t)}
          @input=${t=>this.set(e.key,t.target.value)}
        ></textarea
      ></label>`:e.kind===`select`?k`<label class="dk-f"
        >${n}<select @change=${t=>this.set(e.key,t.target.value)}>
          ${(e.options??[]).map(e=>k`<option value=${e.value} ?selected=${String(e.value)===String(t)}>${e.label??e.value}</option>`)}
        </select></label
      >`:e.kind===`checkbox`?k`<label class="dk-f dk-fcheck"
        ><input
          type="checkbox"
          .checked=${!!t}
          @change=${t=>this.set(e.key,t.target.checked)}
        />${n}</label
      >`:k`<label class="dk-f"
      >${n}<input
        type=${e.kind===`number`?`number`:`text`}
        .value=${t==null?``:String(t)}
        @input=${t=>{let n=t.target;this.set(e.key,e.kind===`number`?n.value===``?null:Number(n.value):n.value)}}
    /></label>`}submit(){this.onAction?.(this.panel.action??`save`,{...this.panel.context??{},values:this.values}),this.dirty=!1}cancel(){this.dirty=!1,this.panel.cancelAction&&this.onAction?.(this.panel.cancelAction,{})}render(){let e=this.panel;return k`<div class="dk-panel dk-full">
      ${e.title?k`<div class="dk-l">${e.title}</div>`:``}
      <div class="dk-form">${(e.fields??[]).map(e=>this.field(e))}</div>
      <div class="dk-acts">
        <button class="dk-btn" @click=${()=>this.submit()}>${e.submitLabel??`Save`}</button>
        ${e.cancelAction?k`<button class="dk-btn" @click=${()=>this.cancel()}>Cancel</button>`:``}
      </div>
    </div>`}};K([V({attribute:!1})],q.prototype,`panel`,void 0),K([V({attribute:!1})],q.prototype,`onAction`,void 0),K([H()],q.prototype,`values`,void 0),K([H()],q.prototype,`dirty`,void 0),q=K([B(`dk-form`)],q);var We={warm:`var(--dk-accent)`,cool:`var(--dk-c6)`,you:`var(--dk-c1)`,them:`var(--dk-c2)`,ok:`var(--dk-ok)`,err:`var(--dk-err)`},J=class extends z{constructor(...e){super(...e),this.panel={type:`wordcloud`},this.view=`cloud`,this.fkey=null}createRenderRoot(){return this}facets(){return(this.panel.facets??[]).filter(e=>e.terms&&e.terms.length)}current(){let e=this.facets();return e.find(e=>e.key===this.fkey)??e[0]}body(){let e=this.current();if(!e?.terms?.length)return k`<div class="dk-muted">no terms for this lens</div>`;let t=e.legend&&e.legend.length?k`<div class="dk-legend">
            ${e.legend.map(e=>k`<span><i style="background:${We[e.tone??``]??W(0)}"></i>${e.label}</span>`)}
          </div>`:``,n=[...e.terms].sort((e,t)=>(Number(t.weight)||0)-(Number(e.weight)||0));if(this.view===`bars`){let e=n.slice(0,22);return k`${t}${He(e.map(e=>e.text),e.map(e=>Number(e.weight)||0))}`}let r=n.map(e=>Number(e.weight)||0),i=Math.max(...r,1),a=Math.min(...r,0),o=i-a||1;return k`${t}<div class="dk-cloud">
      ${n.slice(0,70).map((e,t)=>k`<span style="font-size:${12+Math.round(24*Math.sqrt(((Number(e.weight)||0)-a)/o))}px;color:${e.tone&&We[e.tone]?We[e.tone]:W(e.group==null?t:e.group)}" title=${String(e.weight??``)}>${e.text}</span>`)}
    </div>`}controls(){let e=this.facets(),t=this.current();return k`<div class="dk-wc-ctl">${e.length>1?k`<span class="dk-tg">
            ${e.map(e=>k`<button
                class="dk-tg-b ${e.key===t?.key?`on`:``}"
                @click=${()=>{this.fkey=e.key}}
              >
                ${e.label??e.key}
              </button>`)}
          </span>`:``}${k`<span class="dk-tg">
      ${[`cloud`,`bars`].map(e=>k`<button
          class="dk-tg-b ${e===this.view?`on`:``}"
          @click=${()=>{this.view=e}}
        >
          ${e}
        </button>`)}
    </span>`}</div>`}render(){let e=this.panel,t=this.facets().length>0;return k`<div class="dk-panel dk-full">
      ${e.title?k`<div class="dk-l">${e.title}</div>`:``}${t?this.controls():``}
      <div class="dk-wc-body">${t?this.body():k`<div class="dk-muted">no terms available</div>`}</div>
    </div>`}};K([V({attribute:!1})],J.prototype,`panel`,void 0),K([H()],J.prototype,`view`,void 0),K([H()],J.prototype,`fkey`,void 0),J=K([B(`dk-wordcloud`)],J);var Ge=e=>k`<div class="dk-panel dk-full dk-sec">${e.title??``}</div>`,Ke=e=>k`
  <div class="dk-panel dk-stat">
    <div class="dk-l">${e.label??``}</div>
    <div class="dk-n">${G(e.value)}${e.sub==null?``:k` <small>${e.sub}</small>`}</div>
    ${e.spark&&e.spark.length?Re(e.spark,W(e.color??0)):``}
  </div>`,qe=e=>{let t=Number(e.max)||0,n=Number(e.value)||0,r=e.pct==null?t?100*n/t:0:Number(e.pct),i=e.text==null?t?`${G(n)} / ${G(t)} · ${r.toFixed(1)}%`:G(n):e.text,a=`${Math.max(0,Math.min(100,r)).toFixed(1)}%`;return k`
    <div class="dk-panel dk-full">
      <div class="dk-l">${e.label??``}</div>
      <div class="dk-bar"><i style="width:${a}"></i></div>
      <div class="dk-sub">${i}</div>
    </div>`},Je=(e,t)=>e[t]===`right`||e[t]===`num`,Ye=e=>{let t=e.columns??[],n=e.rows??[],r=e.align??[];return k`
    <div class="dk-panel dk-full">
      ${e.title?k`<div class="dk-l">${e.title}</div>`:``}
      <table class="dk-tbl">
        <thead>
          <tr>
            ${t.map((e,t)=>k`<th class=${Je(r,t)?`num`:``}>${e}</th>`)}
          </tr>
        </thead>
        <tbody>
          ${n.map(e=>k`<tr>
              ${e.map((e,t)=>k`<td class=${Je(r,t)?`num`:``}>
                    ${typeof e==`number`?G(e):e}
                  </td>`)}
            </tr>`)}
        </tbody>
      </table>
    </div>`},Xe=e=>k`
  <div class="dk-panel">
    ${e.title?k`<div class="dk-l" style="margin-bottom:6px">${e.title}</div>`:``}
    <div class="dk-kv">
      ${(e.items??[]).map(e=>k`<div class="r">
            <b>${e.k}</b><span>${typeof e.v==`number`?G(e.v):e.v}</span>
          </div>`)}
    </div>
  </div>`,Ze=e=>{let t=e.text==null?(e.lines??[]).join(`
`):e.text;return k`
    <div class="dk-panel dk-full">
      ${e.title?k`<div class="dk-l">${e.title}</div>`:``}
      <pre class="dk-log">${t}</pre>
    </div>`},Qe=e=>k`<div class="dk-panel"><span class="dk-pill ${e.tone??``}">${e.text??``}</span></div>`,$e=e=>{let t=String(e.text??``).split(/\n\s*\n/).filter(e=>e.trim());return k`
    <div class="dk-panel dk-full dk-prose">
      ${e.title?k`<div class="dk-l">${e.title}</div>`:``}${t.map(e=>k`<p>${e.trim()}</p>`)}
    </div>`},et=e=>k`<div class="dk-panel dk-full">${Ne(e.html??``)}</div>`,tt=(e,t)=>k`
  <div class="dk-panel dk-full">
    ${e.title?k`<div class="dk-l">${e.title}</div>`:``}
    <div class="dk-acts">
      ${(e.buttons??[]).map(e=>k`<button
          class="dk-btn ${e.tone??``}"
          @click=${()=>t?.(e.action??``,e.payload??{})}
        >
          ${e.label??e.action??`action`}
        </button>`)}
    </div>
  </div>`;function nt(e,t){try{switch(e.type){case`section`:return Ge(e);case`stat`:return Ke(e);case`progress`:return qe(e);case`chart`:return Ue(e);case`table`:return Ye(e);case`kv`:return Xe(e);case`log`:return Ze(e);case`badge`:return Qe(e);case`prose`:return $e(e);case`html`:return et(e);case`actions`:return tt(e,t);case`button`:{let n=e;return tt({type:`actions`,title:n.title,buttons:[{label:n.label,action:n.action,payload:n.payload,tone:n.tone}]},t)}case`form`:return k`<dk-form .panel=${e} .onAction=${t}></dk-form>`;case`wordcloud`:return k`<dk-wordcloud .panel=${e}></dk-wordcloud>`;default:return k`<div class="dk-panel dk-full">
          <span class="dk-muted">unknown atom: ${e.type}</span>
        </div>`}}catch(t){let n=t instanceof Error?t.message:String(t);return k`<div class="dk-panel dk-full dk-err">atom error (${e.type}): ${n}</div>`}}var rt=`
.dk-root{--dk-bg:#16140f;--dk-panel:#1f1b15;--dk-fg:#ece6d8;--dk-muted:#9a9384;--dk-line:#352f25;
  --dk-accent:#d98a4f;--dk-accent2:#cda94e;--dk-ok:#6fa8a0;--dk-warn:#cda94e;--dk-err:#d4707a;
  --dk-c1:#d98a4f;--dk-c2:#6fa8a0;--dk-c3:#cda94e;--dk-c4:#a98bd0;--dk-c5:#d4707a;--dk-c6:#7f9bd1;
  color:var(--dk-fg);background:var(--dk-bg);font:14px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;
  box-sizing:border-box;padding:18px 20px;display:block;min-height:100%}
.dk-root *{box-sizing:border-box}
html[data-theme=light] .dk-root,.dk-root[data-theme=light]{--dk-bg:#faf8f3;--dk-panel:#fff;--dk-fg:#1c1b19;
  --dk-muted:#7a756c;--dk-line:#e7e2d8;--dk-accent:#b4541f;--dk-accent2:#9a7a18;--dk-ok:#3f807a;
  --dk-warn:#9a7a18;--dk-err:#b1414f;--dk-c1:#b4541f;--dk-c2:#3f807a;--dk-c3:#9a7a18;--dk-c4:#7a5bb0;
  --dk-c5:#b1414f;--dk-c6:#41639b}
.dk-title{font-size:16px;font-weight:600;letter-spacing:.02em;margin:0 0 12px}
.dk-panels{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:12px;align-items:start}
.dk-panel{border:1px solid var(--dk-line);border-radius:10px;padding:11px 13px;background:var(--dk-panel);min-width:0}
.dk-full{grid-column:1/-1}
.dk-sec{border:0;background:none;padding:8px 2px 0;font-size:11px;text-transform:uppercase;letter-spacing:.08em;color:var(--dk-muted)}
.dk-l{font-size:11px;color:var(--dk-muted);text-transform:uppercase;letter-spacing:.06em}
.dk-n{font-size:22px;font-family:ui-monospace,monospace;margin:1px 0 3px;line-height:1.1;word-break:break-word}
.dk-n small{font-size:12px;color:var(--dk-muted)}
.dk-sub{font-size:12px;color:var(--dk-muted);margin-top:3px}
.dk-muted{color:var(--dk-muted)} .dk-err{color:var(--dk-err)}
.dk-stat svg{width:100%;height:46px;display:block;margin-top:4px}
.dk-chart svg{width:100%;height:auto;display:block}
.dk-bar{height:14px;background:var(--dk-bg);border:1px solid var(--dk-line);border-radius:8px;overflow:hidden;margin:8px 0 4px}
.dk-bar>i{display:block;height:100%;width:0;border-radius:8px;background:linear-gradient(90deg,var(--dk-accent2),var(--dk-accent));transition:width .6s ease}
.dk-pill{display:inline-block;padding:2px 9px;border-radius:20px;font-size:11px;border:1px solid var(--dk-line);color:var(--dk-muted)}
.dk-pill.ok,.dk-pill.done{color:var(--dk-ok);border-color:var(--dk-ok)}
.dk-pill.run,.dk-pill.accent{color:var(--dk-accent);border-color:var(--dk-accent)}
.dk-pill.warn{color:var(--dk-warn);border-color:var(--dk-warn)} .dk-pill.err{color:var(--dk-err);border-color:var(--dk-err)}
.dk-kv{display:flex;flex-direction:column;gap:4px}
.dk-kv .r{display:flex;justify-content:space-between;gap:12px;font-size:13px}
.dk-kv .r span{color:var(--dk-muted);font-family:ui-monospace,monospace}
table.dk-tbl{border-collapse:collapse;width:100%;font-variant-numeric:tabular-nums}
.dk-tbl th,.dk-tbl td{padding:5px 12px 5px 0;text-align:left;border-bottom:1px solid var(--dk-line);white-space:nowrap}
.dk-tbl th{color:var(--dk-muted);font-weight:600;font-size:12px}
.dk-tbl td.num,.dk-tbl th.num{text-align:right;font-family:ui-monospace,monospace}
pre.dk-log{background:var(--dk-bg);border:1px solid var(--dk-line);border-radius:9px;padding:11px;overflow:auto;font-size:12px;color:var(--dk-muted);white-space:pre-wrap;margin:4px 0 0;max-height:260px}
.dk-prose{max-width:780px} .dk-prose p{margin:0 0 11px;line-height:1.62;color:var(--dk-fg);font-size:14px} .dk-prose p:last-child{margin-bottom:0}
.dk-chart .dk-l{margin-bottom:4px}
.dk-grid{stroke:var(--dk-line);stroke-width:1} .dk-axis{stroke:var(--dk-muted);stroke-width:1;opacity:.5}
.dk-tick{fill:var(--dk-muted);font-size:11px;font-family:ui-monospace,monospace}
.dk-cval{fill:var(--dk-fg);font-size:11px;font-family:ui-monospace,monospace}
.dk-legend{display:flex;gap:14px;flex-wrap:wrap;font-size:12px;color:var(--dk-muted);margin-top:4px}
.dk-legend i{display:inline-block;width:10px;height:10px;border-radius:2px;margin-right:5px;vertical-align:middle}
.dk-acts{display:flex;flex-wrap:wrap;gap:6px}
.dk-btn{cursor:pointer;border:1px solid var(--dk-line);background:var(--dk-panel);color:var(--dk-fg);border-radius:6px;padding:5px 12px;font:inherit}
.dk-btn:hover{border-color:var(--dk-accent);color:var(--dk-accent)} .dk-btn[disabled]{opacity:.4;cursor:not-allowed}
.dk-wc-ctl{display:flex;gap:10px;margin:4px 0 10px;flex-wrap:wrap}
.dk-tg{display:inline-flex;border:1px solid var(--dk-line);border-radius:6px;overflow:hidden}
.dk-tg-b{border:0;border-right:1px solid var(--dk-line);background:var(--dk-panel);color:var(--dk-muted);font:inherit;font-size:12px;padding:3px 10px;cursor:pointer}
.dk-tg-b:last-child{border-right:0} .dk-tg-b.on{color:var(--dk-accent);background:var(--dk-bg)} .dk-tg-b:hover{color:var(--dk-fg)}
.dk-cloud{display:flex;flex-wrap:wrap;gap:4px 13px;align-items:baseline;padding:8px 2px;line-height:1.25}
.dk-cloud span{white-space:nowrap}
.dk-form{display:grid;grid-template-columns:repeat(auto-fill,minmax(220px,1fr));gap:10px;margin:6px 0 10px}
.dk-f{display:flex;flex-direction:column;gap:3px;font-size:12px;min-width:0} .dk-f.dk-full{grid-column:1/-1}
.dk-fl{color:var(--dk-muted);font-size:11px}
.dk-f input,.dk-f select,.dk-f textarea{background:var(--dk-bg);border:1px solid var(--dk-line);border-radius:6px;color:var(--dk-fg);font:inherit;font-size:13px;padding:6px 8px;width:100%}
.dk-f textarea{min-height:84px;resize:vertical} .dk-fcheck{flex-direction:row;align-items:center;gap:7px}`;function it(){if(typeof document>`u`||document.getElementById(`dk-css`))return;let e=document.createElement(`style`);e.id=`dk-css`,e.textContent=rt,(document.head??document.documentElement).appendChild(e)}function at(e,t,n){it(),t.classList.add(`dk-root`);let r=e.panels??[];Ee(k`
      ${e.title?k`<div class="dk-title">${e.title}</div>`:``}
      <div class="dk-panels">${r.map(e=>nt(e,n))}</div>
    `,t)}function ot(e){let t=(typeof e.mount==`string`?document.querySelector(e.mount):e.mount)??document.body,{actionUrl:n}=e,r=e.onAction??(n?(e,t)=>{fetch(n,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({action:e,payload:t})}).catch(()=>{})}:void 0),i=!1,a,o=async()=>{if(!i){try{let n=await(await fetch(e.renderUrl,{cache:`no-store`})).json();if(i)return;at(n,t,r)}catch{}a=setTimeout(()=>void o(),e.refreshMs??3e3)}};return o(),{stop:()=>{i=!0,a&&clearTimeout(a)}}}var Y=e=>e.status===`live`;function X(e){if(e.state===`starting`)return{word:`starting…`,cls:`starting`};if(e.state===`unhealthy`)return{word:`unhealthy`,cls:`unhealthy`};if(Y(e))return{word:`live`,cls:`live`};let t=e.last_stop_reason;return t&&t.kind===`crash`?{word:`crashed${t.exit==null?``:` (exit ${t.exit})`}`,cls:`crash`}:t&&t.kind===`port-busy`?{word:`port busy`,cls:`crash`}:{word:`stopped`,cls:`stopped`}}var st=e=>!Y(e)&&(e.cmd?.length??0)>0,ct=e=>Y(e)&&!!e.controllable&&e.stop!==`leave`,Z=class extends z{constructor(...e){super(...e),this.entry=null,this.mountSpec=e=>ot(e),this.framed=null,this.handle=null}createRenderRoot(){return this}emit(e,t){this.dispatchEvent(new CustomEvent(`action`,{detail:{verb:e,id:t},bubbles:!0,composed:!0}))}stopMount(){this.handle&&=(this.handle.stop(),null)}disconnectedCallback(){super.disconnectedCallback(),this.stopMount()}updated(){let e=this.entry,t=e?`${e.id}:${e.state??``}:${e.render??``}`:null;if(t!==this.framed&&(this.framed=t,this.stopMount(),e&&Y(e)&&e.render===`spec`)){let t=this.querySelector(`#dkhost`);t&&(this.handle=this.mountSpec({renderUrl:`/api/render?id=${encodeURIComponent(e.id)}`,mount:t,onAction:(t,n)=>this.dispatchEvent(new CustomEvent(`spec-action`,{detail:{id:e.id,action:t,payload:n},bubbles:!0,composed:!0}))}))}}head(e){let t=X(e);return k`<div class="dhead">
      <h2>${e.name??e.id}</h2>
      <span class="pill ${t.cls}">${t.word}</span>
      <span class="why">${e.blurb??``}</span>
      <div class="acts">
        ${st(e)?k`<button class="btn" @click=${()=>this.emit(`start`,e.id)}>Start</button>`:``}
        ${ct(e)?k`<button class="btn stop" @click=${()=>this.emit(`stop`,e.id)}>Stop</button>`:``}
        ${e.controllable?k`<button class="btn" @click=${()=>this.emit(`restart`,e.id)}>Restart</button>`:``}
        ${e.port?k`<a class="btn" href="http://127.0.0.1:${e.port}/" target="_blank" rel="noreferrer">open ↗</a>`:``}
      </div>
    </div>`}body(e){return e.type===`terminal`?k`<div class="pane">
        <h3>Terminal project</h3>
        <div>dod can launch it but cannot observe its window (accepted gap).</div>
      </div>`:e.state===`starting`?k`<div class="pane"><div class="spin"></div>
        <h3>starting ${e.name??e.id}…</h3><pre>${e.log_tail??``}</pre></div>`:e.state===`crashed`||e.state===`unhealthy`?k`<div class="pane">
        <h3 style="color:var(--err)">${X(e).word}</h3>
        <pre>${e.log_tail??``}</pre>
        <button class="btn" @click=${()=>this.emit(`restart`,e.id)}>Restart</button>
      </div>`:Y(e)?e.render===`spec`?k`<div class="dk-host" id="dkhost"></div>`:e.embeddable?k`<iframe id="frame" src="http://127.0.0.1:${e.port}/"></iframe>`:k`<div class="pane">
      <h3>Can't embed ${e.name??e.id}</h3>
      <a class="btn" href="http://127.0.0.1:${e.port}/" target="_blank" rel="noreferrer">open in new tab ↗</a>
    </div>`:k`<div class="pane">
        <h3>${X(e).word}</h3>
        <div>${e.why??``}</div>
        ${st(e)?k`<button class="btn" @click=${()=>this.emit(`start`,e.id)}>Start</button>`:k`<div>Start it yourself; dod will adopt the port.</div>`}
      </div>`}render(){let e=this.entry;return e?k`${this.head(e)}<div class="body">${this.body(e)}</div>`:k`<div class="empty">Select a project on the left.</div>`}};K([V({attribute:!1})],Z.prototype,`entry`,void 0),Z=K([B(`dod-detail`)],Z);var Q=class extends z{constructor(...e){super(...e),this.entries=[],this.selected=null,this.dragId=null}createRenderRoot(){return this}emit(e,t){this.dispatchEvent(new CustomEvent(e,{detail:t,bubbles:!0,composed:!0}))}button(e){return ct(e)?k`<button
        class="btn stop"
        @click=${t=>{t.stopPropagation(),this.emit(`action`,{verb:`stop`,id:e.id})}}
      >
        Stop
      </button>`:st(e)?k`<button
        class="btn"
        @click=${t=>{t.stopPropagation(),this.emit(`action`,{verb:`start`,id:e.id})}}
      >
        Start
      </button>`:``}drop(e){let t=this.dragId;this.dragId=null,!(!t||t===e)&&this.emit(`reorder`,{from:t,to:e})}render(){return this.entries.length?k`${this.entries.map(e=>{let t=X(e);return k`<div
        class="item ${e.id===this.selected?`sel`:``}"
        draggable="true"
        @dragstart=${()=>{this.dragId=e.id}}
        @dragover=${e=>e.preventDefault()}
        @drop=${()=>this.drop(e.id)}
        @click=${()=>this.emit(`select`,e.id)}
      >
        <div class="nm">${e.name??e.id}</div>
        <div class="right"><span class="pill ${t.cls}">${t.word}</span>${this.button(e)}</div>
        <div class="desc">${e.blurb??``}</div>
      </div>`})}`:k`<div class="empty" style="padding:30px">
        No projects. Add a dod.project.json to a project, or register one with the CLI.
      </div>`}};K([V({attribute:!1})],Q.prototype,`entries`,void 0),K([V()],Q.prototype,`selected`,void 0),Q=K([B(`dod-list`)],Q);function lt(e,t,n){let r=[...e],i=r.indexOf(t),a=r.indexOf(n);if(i<0||a<0||t===n)return r;let[o]=r.splice(i,1);return r.splice(a,0,o),r}var $=class extends z{constructor(...t){super(...t),this.api=new e(``),this.reload=()=>location.reload(),this.entries=[],this.selected=null,this.stopped=!1}createRenderRoot(){return this}start(e=2e3){this.stopped=!1;let t=async()=>{this.stopped||(await this.refresh(),this.timer=setTimeout(()=>void t(),e))};t()}disconnectedCallback(){super.disconnectedCallback(),this.stopped=!0,this.timer&&clearTimeout(this.timer)}async refresh(){let{entries:e}=await this.api.state();this.entries=e.filter(e=>e.state!==`archived`),this.selected&&!this.entries.some(e=>e.id===this.selected)&&(this.selected=null)}async act(e,t){if((await this.api.post(e,{id:t})).error===`forbidden`){this.reload();return}await this.refresh()}async specAction(e){(await this.api.post(`action`,{id:e.id,action:e.action,payload:e.payload})).error===`forbidden`&&this.reload()}async doReorder(e,t){let n=lt(this.entries.map(e=>e.id),e,t),r=new Map(n.map((e,t)=>[e,t]));this.entries=[...this.entries].sort((e,t)=>(r.get(e.id)??0)-(r.get(t.id)??0)),await this.api.post(`reorder`,{order:n})}render(){let e=this.entries.filter(Y).length,t=this.entries.find(e=>e.id===this.selected)??null;return k`
      <header>
        <b>dod</b><span class="tagline">project control</span>
        <span class="spacer"></span>
        <span id="count" class="count">${e} live / ${this.entries.length}</span>
      </header>
      <dod-list
        .entries=${this.entries}
        .selected=${this.selected}
        @select=${e=>{this.selected=e.detail}}
        @action=${e=>void this.act(e.detail.verb,e.detail.id)}
        @reorder=${e=>void this.doReorder(e.detail.from,e.detail.to)}
      ></dod-list>
      <dod-detail
        .entry=${t}
        @action=${e=>void this.act(e.detail.verb,e.detail.id)}
        @spec-action=${e=>void this.specAction(e.detail)}
      ></dod-detail>
    `}};K([H()],$.prototype,`entries`,void 0),K([H()],$.prototype,`selected`,void 0),$=K([B(`dod-app`)],$);function ut(t=document.body){let n=document.createElement(`dod-app`);return n.api=new e(window.TOKEN??``),t.appendChild(n),n.start(),n}ut()})();