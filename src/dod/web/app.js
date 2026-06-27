(function(){var e=class{constructor(e,t=(e,t)=>fetch(e,t)){this.token=e,this.doFetch=t}async state(){try{let e=await(await this.doFetch(`/api/state`)).json();return{entries:e.entries??[],discovered:e.discovered??[]}}catch{return{entries:[],discovered:[]}}}async post(e,t={}){let n=await this.doFetch(`/api/${e}`,{method:`POST`,headers:{"Content-Type":`application/json`,"X-Dod-Token":this.token},body:JSON.stringify(t)});if(n.status===403)return{ok:!1,error:`forbidden`,detail:`token rotated`};try{return await n.json()}catch{return{}}}},t=globalThis,n=t.ShadowRoot&&(t.ShadyCSS===void 0||t.ShadyCSS.nativeShadow)&&`adoptedStyleSheets`in Document.prototype&&`replace`in CSSStyleSheet.prototype,r=Symbol(),i=new WeakMap,a=class{constructor(e,t,n){if(this._$cssResult$=!0,n!==r)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o,t=this.t;if(n&&e===void 0){let n=t!==void 0&&t.length===1;n&&(e=i.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),n&&i.set(t,e))}return e}toString(){return this.cssText}},o=e=>new a(typeof e==`string`?e:e+``,void 0,r),s=(e,r)=>{if(n)e.adoptedStyleSheets=r.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let n of r){let r=document.createElement(`style`),i=t.litNonce;i!==void 0&&r.setAttribute(`nonce`,i),r.textContent=n.cssText,e.appendChild(r)}},c=n?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t=``;for(let n of e.cssRules)t+=n.cssText;return o(t)})(e):e,{is:l,defineProperty:u,getOwnPropertyDescriptor:d,getOwnPropertyNames:f,getOwnPropertySymbols:p,getPrototypeOf:m}=Object,h=globalThis,g=h.trustedTypes,ee=g?g.emptyScript:``,te=h.reactiveElementPolyfillSupport,_=(e,t)=>e,v={toAttribute(e,t){switch(t){case Boolean:e=e?ee:null;break;case Object:case Array:e=e==null?e:JSON.stringify(e)}return e},fromAttribute(e,t){let n=e;switch(t){case Boolean:n=e!==null;break;case Number:n=e===null?null:Number(e);break;case Object:case Array:try{n=JSON.parse(e)}catch{n=null}}return n}},y=(e,t)=>!l(e,t),ne={attribute:!0,type:String,converter:v,reflect:!1,useDefault:!1,hasChanged:y};Symbol.metadata??=Symbol(`metadata`),h.litPropertyMetadata??=new WeakMap;var b=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=ne){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){let n=Symbol(),r=this.getPropertyDescriptor(e,n,t);r!==void 0&&u(this.prototype,e,r)}}static getPropertyDescriptor(e,t,n){let{get:r,set:i}=d(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:r,set(t){let a=r?.call(this);i?.call(this,t),this.requestUpdate(e,a,n)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??ne}static _$Ei(){if(this.hasOwnProperty(_(`elementProperties`)))return;let e=m(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(_(`finalized`)))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(_(`properties`))){let e=this.properties,t=[...f(e),...p(e)];for(let n of t)this.createProperty(n,e[n])}let e=this[Symbol.metadata];if(e!==null){let t=litPropertyMetadata.get(e);if(t!==void 0)for(let[e,n]of t)this.elementProperties.set(e,n)}this._$Eh=new Map;for(let[e,t]of this.elementProperties){let n=this._$Eu(e,t);n!==void 0&&this._$Eh.set(n,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let t=[];if(Array.isArray(e)){let n=new Set(e.flat(1/0).reverse());for(let e of n)t.unshift(c(e))}else e!==void 0&&t.push(c(e));return t}static _$Eu(e,t){let n=t.attribute;return!1===n?void 0:typeof n==`string`?n:typeof e==`string`?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,t=this.constructor.elementProperties;for(let n of t.keys())this.hasOwnProperty(n)&&(e.set(n,this[n]),delete this[n]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return s(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,n){this._$AK(e,n)}_$ET(e,t){let n=this.constructor.elementProperties.get(e),r=this.constructor._$Eu(e,n);if(r!==void 0&&!0===n.reflect){let i=(n.converter?.toAttribute===void 0?v:n.converter).toAttribute(t,n.type);this._$Em=e,i==null?this.removeAttribute(r):this.setAttribute(r,i),this._$Em=null}}_$AK(e,t){let n=this.constructor,r=n._$Eh.get(e);if(r!==void 0&&this._$Em!==r){let e=n.getPropertyOptions(r),i=typeof e.converter==`function`?{fromAttribute:e.converter}:e.converter?.fromAttribute===void 0?v:e.converter;this._$Em=r;let a=i.fromAttribute(t,e.type);this[r]=a??this._$Ej?.get(r)??a,this._$Em=null}}requestUpdate(e,t,n,r=!1,i){if(e!==void 0){let a=this.constructor;if(!1===r&&(i=this[e]),n??=a.getPropertyOptions(e),!((n.hasChanged??y)(i,t)||n.useDefault&&n.reflect&&i===this._$Ej?.get(e)&&!this.hasAttribute(a._$Eu(e,n))))return;this.C(e,t,n)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:n,reflect:r,wrapped:i},a){n&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,a??t??this[e]),!0!==i||a!==void 0)||(this._$AL.has(e)||(this.hasUpdated||n||(t=void 0),this._$AL.set(e,t)),!0===r&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}let e=this.constructor.elementProperties;if(e.size>0)for(let[t,n]of e){let{wrapped:e}=n,r=this[t];!0!==e||this._$AL.has(t)||r===void 0||this.C(t,void 0,n,r)}}let e=!1,t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};b.elementStyles=[],b.shadowRootOptions={mode:`open`},b[_(`elementProperties`)]=new Map,b[_(`finalized`)]=new Map,te?.({ReactiveElement:b}),(h.reactiveElementVersions??=[]).push(`2.1.2`);var re=globalThis,ie=e=>e,x=re.trustedTypes,ae=x?x.createPolicy(`lit-html`,{createHTML:e=>e}):void 0,oe=`$lit$`,S=`lit$${Math.random().toFixed(9).slice(2)}$`,se=`?`+S,ce=`<${se}>`,C=document,w=()=>C.createComment(``),T=e=>e===null||typeof e!=`object`&&typeof e!=`function`,le=Array.isArray,ue=e=>le(e)||typeof e?.[Symbol.iterator]==`function`,de=`[ 	
\f\r]`,E=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,fe=/-->/g,pe=/>/g,D=RegExp(`>|${de}(?:([^\\s"'>=/]+)(${de}*=${de}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,`g`),me=/'/g,he=/"/g,ge=/^(?:script|style|textarea|title)$/i,_e=e=>(t,...n)=>({_$litType$:e,strings:t,values:n}),O=_e(1),k=_e(2),A=Symbol.for(`lit-noChange`),j=Symbol.for(`lit-nothing`),ve=new WeakMap,M=C.createTreeWalker(C,129);function ye(e,t){if(!le(e)||!e.hasOwnProperty(`raw`))throw Error(`invalid template strings array`);return ae===void 0?t:ae.createHTML(t)}var be=(e,t)=>{let n=e.length-1,r=[],i,a=t===2?`<svg>`:t===3?`<math>`:``,o=E;for(let t=0;t<n;t++){let n=e[t],s,c,l=-1,u=0;for(;u<n.length&&(o.lastIndex=u,c=o.exec(n),c!==null);)u=o.lastIndex,o===E?c[1]===`!--`?o=fe:c[1]===void 0?c[2]===void 0?c[3]!==void 0&&(o=D):(ge.test(c[2])&&(i=RegExp(`</`+c[2],`g`)),o=D):o=pe:o===D?c[0]===`>`?(o=i??E,l=-1):c[1]===void 0?l=-2:(l=o.lastIndex-c[2].length,s=c[1],o=c[3]===void 0?D:c[3]===`"`?he:me):o===he||o===me?o=D:o===fe||o===pe?o=E:(o=D,i=void 0);let d=o===D&&e[t+1].startsWith(`/>`)?` `:``;a+=o===E?n+ce:l>=0?(r.push(s),n.slice(0,l)+oe+n.slice(l)+S+d):n+S+(l===-2?t:d)}return[ye(e,a+(e[n]||`<?>`)+(t===2?`</svg>`:t===3?`</math>`:``)),r]},N=class e{constructor({strings:t,_$litType$:n},r){let i;this.parts=[];let a=0,o=0,s=t.length-1,c=this.parts,[l,u]=be(t,n);if(this.el=e.createElement(l,r),M.currentNode=this.el.content,n===2||n===3){let e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;(i=M.nextNode())!==null&&c.length<s;){if(i.nodeType===1){if(i.hasAttributes())for(let e of i.getAttributeNames())if(e.endsWith(oe)){let t=u[o++],n=i.getAttribute(e).split(S),r=/([.?@])?(.*)/.exec(t);c.push({type:1,index:a,name:r[2],strings:n,ctor:r[1]===`.`?Se:r[1]===`?`?Ce:r[1]===`@`?we:I}),i.removeAttribute(e)}else e.startsWith(S)&&(c.push({type:6,index:a}),i.removeAttribute(e));if(ge.test(i.tagName)){let e=i.textContent.split(S),t=e.length-1;if(t>0){i.textContent=x?x.emptyScript:``;for(let n=0;n<t;n++)i.append(e[n],w()),M.nextNode(),c.push({type:2,index:++a});i.append(e[t],w())}}}else if(i.nodeType===8)if(i.data===se)c.push({type:2,index:a});else{let e=-1;for(;(e=i.data.indexOf(S,e+1))!==-1;)c.push({type:7,index:a}),e+=S.length-1}a++}}static createElement(e,t){let n=C.createElement(`template`);return n.innerHTML=e,n}};function P(e,t,n=e,r){if(t===A)return t;let i=r===void 0?n._$Cl:n._$Co?.[r],a=T(t)?void 0:t._$litDirective$;return i?.constructor!==a&&(i?._$AO?.(!1),a===void 0?i=void 0:(i=new a(e),i._$AT(e,n,r)),r===void 0?n._$Cl=i:(n._$Co??=[])[r]=i),i!==void 0&&(t=P(e,i._$AS(e,t.values),i,r)),t}var xe=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:t},parts:n}=this._$AD,r=(e?.creationScope??C).importNode(t,!0);M.currentNode=r;let i=M.nextNode(),a=0,o=0,s=n[0];for(;s!==void 0;){if(a===s.index){let t;s.type===2?t=new F(i,i.nextSibling,this,e):s.type===1?t=new s.ctor(i,s.name,s.strings,this,e):s.type===6&&(t=new Te(i,this,e)),this._$AV.push(t),s=n[++o]}a!==s?.index&&(i=M.nextNode(),a++)}return M.currentNode=C,r}p(e){let t=0;for(let n of this._$AV)n!==void 0&&(n.strings===void 0?n._$AI(e[t]):(n._$AI(e,n,t),t+=n.strings.length-2)),t++}},F=class e{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,n,r){this.type=2,this._$AH=j,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=n,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=P(this,e,t),T(e)?e===j||e==null||e===``?(this._$AH!==j&&this._$AR(),this._$AH=j):e!==this._$AH&&e!==A&&this._(e):e._$litType$===void 0?e.nodeType===void 0?ue(e)?this.k(e):this._(e):this.T(e):this.$(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==j&&T(this._$AH)?this._$AA.nextSibling.data=e:this.T(C.createTextNode(e)),this._$AH=e}$(e){let{values:t,_$litType$:n}=e,r=typeof n==`number`?this._$AC(e):(n.el===void 0&&(n.el=N.createElement(ye(n.h,n.h[0]),this.options)),n);if(this._$AH?._$AD===r)this._$AH.p(t);else{let e=new xe(r,this),n=e.u(this.options);e.p(t),this.T(n),this._$AH=e}}_$AC(e){let t=ve.get(e.strings);return t===void 0&&ve.set(e.strings,t=new N(e)),t}k(t){le(this._$AH)||(this._$AH=[],this._$AR());let n=this._$AH,r,i=0;for(let a of t)i===n.length?n.push(r=new e(this.O(w()),this.O(w()),this,this.options)):r=n[i],r._$AI(a),i++;i<n.length&&(this._$AR(r&&r._$AB.nextSibling,i),n.length=i)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){let t=ie(e).nextSibling;ie(e).remove(),e=t}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},I=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,n,r,i){this.type=1,this._$AH=j,this._$AN=void 0,this.element=e,this.name=t,this._$AM=r,this.options=i,n.length>2||n[0]!==``||n[1]!==``?(this._$AH=Array(n.length-1).fill(new String),this.strings=n):this._$AH=j}_$AI(e,t=this,n,r){let i=this.strings,a=!1;if(i===void 0)e=P(this,e,t,0),a=!T(e)||e!==this._$AH&&e!==A,a&&(this._$AH=e);else{let r=e,o,s;for(e=i[0],o=0;o<i.length-1;o++)s=P(this,r[n+o],t,o),s===A&&(s=this._$AH[o]),a||=!T(s)||s!==this._$AH[o],s===j?e=j:e!==j&&(e+=(s??``)+i[o+1]),this._$AH[o]=s}a&&!r&&this.j(e)}j(e){e===j?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??``)}},Se=class extends I{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===j?void 0:e}},Ce=class extends I{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==j)}},we=class extends I{constructor(e,t,n,r,i){super(e,t,n,r,i),this.type=5}_$AI(e,t=this){if((e=P(this,e,t,0)??j)===A)return;let n=this._$AH,r=e===j&&n!==j||e.capture!==n.capture||e.once!==n.once||e.passive!==n.passive,i=e!==j&&(n===j||r);r&&this.element.removeEventListener(this.name,this,n),i&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH==`function`?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},Te=class{constructor(e,t,n){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=n}get _$AU(){return this._$AM._$AU}_$AI(e){P(this,e)}},Ee=re.litHtmlPolyfillSupport;Ee?.(N,F),(re.litHtmlVersions??=[]).push(`3.3.3`);var De=(e,t,n)=>{let r=n?.renderBefore??t,i=r._$litPart$;if(i===void 0){let e=n?.renderBefore??null;r._$litPart$=i=new F(t.insertBefore(w(),e),e,void 0,n??{})}return i._$AI(e),i},L=globalThis,R=class extends b{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=De(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return A}};R._$litElement$=!0,R.finalized=!0,L.litElementHydrateSupport?.({LitElement:R});var Oe=L.litElementPolyfillSupport;Oe?.({LitElement:R}),(L.litElementVersions??=[]).push(`4.2.2`);var z=e=>(t,n)=>{n===void 0?customElements.define(e,t):n.addInitializer(()=>{customElements.define(e,t)})},ke={attribute:!0,type:String,converter:v,reflect:!1,hasChanged:y},Ae=(e=ke,t,n)=>{let{kind:r,metadata:i}=n,a=globalThis.litPropertyMetadata.get(i);if(a===void 0&&globalThis.litPropertyMetadata.set(i,a=new Map),r===`setter`&&((e=Object.create(e)).wrapped=!0),a.set(n.name,e),r===`accessor`){let{name:r}=n;return{set(n){let i=t.get.call(this);t.set.call(this,n),this.requestUpdate(r,i,e,!0,n)},init(t){return t!==void 0&&this.C(r,void 0,e,t),t}}}if(r===`setter`){let{name:r}=n;return function(n){let i=this[r];t.call(this,n),this.requestUpdate(r,i,e,!0,n)}}throw Error(`Unsupported decorator location: `+r)};function B(e){return(t,n)=>typeof n==`object`?Ae(e,t,n):((e,t,n)=>{let r=t.hasOwnProperty(n);return t.constructor.createProperty(n,e),r?Object.getOwnPropertyDescriptor(t,n):void 0})(e,t,n)}function V(e){return B({...e,state:!0,attribute:!1})}var je={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},Me=e=>(...t)=>({_$litDirective$:e,values:t}),Ne=class{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,t,n){this._$Ct=e,this._$AM=t,this._$Ci=n}_$AS(e,t){return this.update(e,t)}update(e,t){return this.render(...t)}},Pe=class extends Ne{constructor(e){if(super(e),this.it=j,e.type!==je.CHILD)throw Error(this.constructor.directiveName+`() can only be used in child bindings`)}render(e){if(e===j||e==null)return this._t=void 0,this.it=e;if(e===A)return e;if(typeof e!=`string`)throw Error(this.constructor.directiveName+`() called with a non-string value`);if(e===this.it)return this._t;this.it=e;let t=[e];return t.raw=t,this._t={_$litType$:this.constructor.resultType,strings:t,values:[]}}};Pe.directiveName=`unsafeHTML`,Pe.resultType=1;var Fe=Me(Pe),Ie=[`var(--dk-c1)`,`var(--dk-c2)`,`var(--dk-c3)`,`var(--dk-c4)`,`var(--dk-c5)`,`var(--dk-c6)`],H=e=>Ie[((Number(e)||0)%6+6)%6];function U(e){return e==null?`–`:typeof e==`number`?Number.isFinite(e)?Number.isInteger(e)?e.toLocaleString():Math.abs(e)>=1e3?e.toLocaleString(void 0,{maximumFractionDigits:1}):e.toFixed(2):`–`:String(e)}function Le(e){let t=Number(e)||0,n=Math.abs(t);return n>=1e9?`${(t/1e9).toFixed(1)}B`:n>=1e6?`${(t/1e6).toFixed(1)}M`:n>=1e3?`${(t/1e3).toFixed(1)}k`:Number.isInteger(t)?String(t):t.toFixed(2)}function Re(e){return typeof e==`string`&&/^\d{4}-\d{2}-\d{2}/.test(e)?e.slice(0,10):String(e)}function W(e,t){let n=String(e);return n.length>t?`${n.slice(0,t-1)}…`:n}function ze(e,t){let n=e.length,r=e.filter(e=>e!=null&&Number.isFinite(e));if(r.length<2)return O`<svg viewBox="0 0 ${240} ${46}"></svg>`;let i=Math.min(...r),a=Math.max(...r)-i||1,o=e=>4+e/(n-1)*232,s=e=>42-(e-i)/a*38,c=``,l=!1;return e.forEach((e,t)=>{if(e==null||!Number.isFinite(e)){l=!1;return}c+=`${l?`L`:`M`}${o(t).toFixed(1)},${s(e).toFixed(1)} `,l=!0}),O`<svg viewBox="0 0 ${240} ${46}" preserveAspectRatio="none">
    <path d=${c} fill="none" stroke=${t} stroke-width="1.6"></path>
  </svg>`}var Be=e=>e===`accent`?`var(--dk-accent)`:e===`err`?`var(--dk-err)`:e===`ok`?`var(--dk-ok)`:`var(--dk-muted)`;function Ve(e,t,n,r){let i={l:60,r:14,t:22,b:72},a=820-i.l-i.r,o=340-i.t-i.b,s=t.length,c=n.length>1,l=0;if(e===`stacked`)for(let e=0;e<s;e++){let t=0;n.forEach(n=>{t+=Math.max(0,Number(n.values[e])||0)}),l=Math.max(l,t)}else n.forEach(e=>e.values.forEach(e=>{l=Math.max(l,Number(e)||0)}));l||=1;let u=e=>i.t+o-e/l*o,d=a/Math.max(1,s),f=e=>i.l+d*e+d/2,p=[];for(let e=0;e<=4;e++){let t=l*e/4,n=u(t);p.push(k`<line class="dk-grid" x1=${i.l} y1=${n} x2=${i.l+a} y2=${n}></line>
      <text class="dk-tick" x=${i.l-8} y=${n+4} text-anchor="end">${Le(t)}</text>`)}let m=s>18?Math.ceil(s/18):1;for(let e=0;e<s;e++){if(e%m)continue;let n=f(e),r=i.t+o+15;p.push(k`<text class="dk-tick" x=${n} y=${r} text-anchor="end" transform=${`rotate(-35 ${n} ${r})`}>${W(Re(t[e]),18)}</text>`)}if(e===`bar`||e===`stacked`){let t=n.length;if(e===`stacked`)for(let e=0;e<s;e++){let t=0;n.forEach((n,r)=>{let i=Math.max(0,Number(n.values[e])||0),a=u(t),o=u(t+i);t+=i;let s=d*.7;p.push(k`<rect x=${f(e)-s/2} y=${o} width=${s} height=${Math.max(0,a-o)} fill=${H(r)}></rect>`)})}else{let e=d*.72,r=c?e/t:e;for(let t=0;t<s;t++)n.forEach((n,a)=>{let s=u(Math.max(0,Number(n.values[t])||0)),l=c?f(t)-e/2+a*r:f(t)-e/2;p.push(k`<rect x=${l} y=${s} width=${Math.max(1,r-(c?1.5:0))} height=${Math.max(0,i.t+o-s)} fill=${H(c?a:0)}></rect>`)})}}else n.forEach((t,n)=>{let r=t.values.map((e,t)=>`${f(t)},${u(Math.max(0,Number(e)||0))}`).join(` `);e===`area`&&!c&&p.push(k`<polygon points=${`${f(0)},${i.t+o} ${r} ${f(s-1)},${i.t+o}`} fill=${H(0)} opacity=".18"></polygon>`),p.push(k`<polyline points=${r} fill="none" stroke=${H(n)} stroke-width="2"></polyline>`),t.values.forEach((e,t)=>p.push(k`<circle cx=${f(t)} cy=${u(Math.max(0,Number(e)||0))} r="2.6" fill=${H(n)}></circle>`))});return p.push(k`<line class="dk-axis" x1=${i.l} y1=${i.t+o} x2=${i.l+a} y2=${i.t+o}></line>
    <line class="dk-axis" x1=${i.l} y1=${i.t} x2=${i.l} y2=${i.t+o}></line>`),(r??[]).forEach(e=>{let n=t.indexOf(e.x);if(n<0)return;let r=f(n),a=Be(e.tone);p.push(k`<line x1=${r} y1=${i.t} x2=${r} y2=${i.t+o} stroke=${a} stroke-width="1" stroke-dasharray="3 3" opacity=".85"></line>`),e.label&&p.push(k`<text x=${r} y=${i.t-6} text-anchor="middle" class="dk-tick" fill=${a}>${e.label}</text>`)}),O`<svg viewBox="0 0 ${820} ${340}">${p}</svg>${c?O`<div class="dk-legend">
        ${n.map((e,t)=>O`<span><i style="background:${H(t)}"></i>${e.name??``}</span>`)}
      </div>`:``}`}function He(e,t,n,r){let i={l:140,r:70,t:8,b:20},a=e.length,o=i.t+i.b+a*30,s=820-i.l-i.r,c=i.l+s/2,l=s/2,u=[k`<line class="dk-axis" x1=${c} y1=${i.t} x2=${c} y2=${i.t+a*30}></line>`];return t.forEach((t,n)=>{let r=Math.max(-1,Math.min(1,Number(t)||0)),a=i.t+n*30,o=Math.abs(r)*l,s=r>=0?c:c-o,d=r>=0?`var(--dk-c1)`:`var(--dk-c2)`;u.push(k`<text class="dk-tick" x=${i.l-10} y=${a+30/2+4} text-anchor="end">${W(e[n],20)}</text>
      <rect x=${s} y=${a+5} width=${Math.max(1,o)} height=${18} rx="2" fill=${d}></rect>
      <text class="dk-cval" x=${r>=0?c+o+6:c-o-6} y=${a+30/2+4} text-anchor=${r>=0?`start`:`end`}>${r>0?`+`:``}${r.toFixed(2)}</text>`)}),u.push(k`<text class="dk-tick" x=${i.l} y=${i.t+a*30+14} text-anchor="start">← ${n??`them`}</text>
    <text class="dk-tick" x=${i.l+s} y=${i.t+a*30+14} text-anchor="end">${r??`you`} →</text>`),O`<svg viewBox="0 0 ${820} ${o}">${u}</svg>`}function Ue(e,t){let n={l:210,r:64,t:6,b:6},r=e.length,i=n.t+n.b+r*22,a=820-n.l-n.r,o=Math.max(...t.map(e=>Number(e)||0),0)||1,s=[];return t.forEach((t,r)=>{let i=n.t+r*22,c=Math.max(0,(Number(t)||0)/o*a);s.push(k`<text class="dk-tick" x=${n.l-8} y=${i+22/2+4} text-anchor="end">${W(Re(e[r]),30)}</text>
      <rect x=${n.l} y=${i+3} width=${c} height=${16} fill=${H(0)}></rect>
      <text class="dk-cval" x=${n.l+c+6} y=${i+22/2+4}>${Le(Number(t)||0)}</text>`)}),O`<svg viewBox="0 0 ${820} ${i}">${s}</svg>`}function We(e){let t=e.kind??`line`,n=e.series??(e.values?[{name:e.label??``,values:e.values}]:[]),r=e.x??(n[0]?n[0].values.map((e,t)=>t):[]),i=n[0]?.values??[],a;return a=t===`spark`?ze(i,H(e.color??0)):t===`diverging`?He(r,i,e.left,e.right):t===`hbar`?Ue(r,i):Ve(t===`bars`?`bar`:t===`stacked`?`stacked`:t===`area`?`area`:`line`,r,n,e.markers),O`<div class="dk-panel dk-chart ${t===`spark`?``:`dk-full`}">
    ${e.title?O`<div class="dk-l">${e.title}</div>`:``}${a}
  </div>`}var Ge={nodeW:168,nodeH:44,colGap:76,rowGap:18,pad:18};function Ke(e,t=[]){let n=new Set(e.map(e=>e.id)),r=new Set,i=[],a=(e,t)=>{if(e===t||!n.has(e)||!n.has(t))return;let a=`${e} ${t}`;r.has(a)||(r.add(a),i.push({from:e,to:t}))};for(let e of t)a(e.from,e.to);for(let t of e)for(let e of t.dependsOn??[])a(e,t.id);return i}function qe(e,t){let n=new Map,r=new Map;for(let t of e)n.set(t,0),r.set(t,[]);for(let e of t)r.get(e.from).push(e.to),n.set(e.to,n.get(e.to)+1);let i=new Map,a=e.filter(e=>n.get(e)===0);for(let e of a)i.set(e,0);let o=0;for(;a.length;){let e=[];for(let t of a){o++;let a=i.get(t);for(let o of r.get(t)){i.set(o,Math.max(i.get(o)??0,a+1));let t=n.get(o)-1;n.set(o,t),t===0&&e.push(o)}}a=e}if(o<e.length){let t=0;for(let e of i.values())t=Math.max(t,e);for(let n of e)i.has(n)||i.set(n,t+1)}return i}function Je(e,t,n,r){let i=(t.get(e)??[]).map(e=>n.get(e)).filter(e=>e!=null);return i.length?i.reduce((e,t)=>e+t,0)/i.length:r}var Ye=(e,t,n)=>{let r=e.get(t);r?r.push(n):e.set(t,[n])};function Xe(e,t=[],n={}){let r={...Ge,...n};if(!e.length)return{nodes:[],edges:[],width:0,height:0};let i=e.map(e=>e.id),a=Ke(e,t),o=qe(i,a),s=1/0;for(let e of o.values())s=Math.min(s,e);if(s>0&&s!==1/0)for(let e of i)o.set(e,o.get(e)-s);let c=new Map,l=new Map,u=new Map,d=(e,t)=>Ye(u,t,e);for(let e of a){let t=o.get(e.from),n=o.get(e.to),r=`${e.from} ${e.to}`;if(l.set(r,[]),n-t>1){let i=e.from;for(let a=t+1;a<n;a++){let t=` d:${e.from}>${e.to}@${a}`;c.set(t,a),l.get(r).push(t),d(i,t),i=t}d(i,e.to)}else n>t&&d(e.from,e.to)}let f=new Map;for(let e of i)Ye(f,o.get(e),e);for(let[e,t]of c)Ye(f,t,e);let p=[...f.keys()].sort((e,t)=>e-t);for(let e of p){if(e===p[0])continue;let t=new Map((f.get(e-1)??[]).map((e,t)=>[e,t])),n=f.get(e),r=new Map(n.map((e,t)=>[e,t]));n.sort((e,n)=>Je(e,u,t,r.get(e))-Je(n,u,t,r.get(n))||r.get(e)-r.get(n))}let m=new Map,h=new Map,g=[];for(let e of p)f.get(e).forEach((t,n)=>{let i=r.pad+e*(r.nodeW+r.colGap),a=r.pad+n*(r.nodeH+r.rowGap);m.set(t,i),h.set(t,a),c.has(t)||g.push({id:t,rank:e,order:n,x:i,y:a,w:r.nodeW,h:r.nodeH})});let ee=e=>({x:m.get(e)+r.nodeW/2,y:h.get(e)+r.nodeH/2}),te=a.map(e=>{let t={x:m.get(e.from),y:h.get(e.from)},n={x:m.get(e.to),y:h.get(e.to)};return{from:e.from,to:e.to,x1:t.x+r.nodeW,y1:t.y+r.nodeH/2,x2:n.x,y2:n.y+r.nodeH/2,waypoints:(l.get(`${e.from} ${e.to}`)??[]).map(ee),back:o.get(e.from)>=o.get(e.to)}}),_=p[p.length-1],v=Math.max(...p.map(e=>f.get(e).length));return{nodes:g,edges:te,width:r.pad*2+(_+1)*r.nodeW+_*r.colGap,height:r.pad*2+v*r.nodeH+(v-1)*r.rowGap}}var Ze={queued:`idle`,pending:`idle`,planning:`active`,"in-cycle":`active`,"in-progress":`active`,green:`good`,landed:`good`,committed:`good`,done:`good`,blocked:`warn`,"needs-hitl":`warn`,error:`err`},Qe=e=>Ze[(e??``).toLowerCase()]??`idle`;function $e(e,t){let n=new Map,r=new Map;for(let t of e)n.set(t,[]),r.set(t,[]);for(let e of t)!n.has(e.from)||!n.has(e.to)||(r.get(e.from).push(e.to),n.get(e.to).push(e.from));return{up:n,down:r}}function et(e,t){let n=new Set,r=[e];for(;r.length;){let e=r.pop();for(let i of t.get(e)??[])n.has(i)||(n.add(i),r.push(i))}return n}function tt(e,t){return new Set([e,...et(e,t.up),...et(e,t.down)])}function nt(e,t){let n=new Set(e.filter(e=>Qe(e.status)===`good`).map(e=>e.id)),r=new Set;for(let i of e)Qe(i.status)===`idle`&&(t.get(i.id)??[]).every(e=>n.has(e))&&r.add(i.id);return r}function G(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a}var rt={idle:`var(--dk-muted)`,active:`var(--dk-accent)`,good:`var(--dk-ok)`,warn:`var(--dk-warn)`,err:`var(--dk-err)`},it=[[`idle`,`queued`],[`active`,`in progress`],[`good`,`done`],[`warn`,`blocked`],[`err`,`error`]],at=e=>rt[Qe(e)];function ot(e){let t=[{x:e.x1,y:e.y1},...e.waypoints,{x:e.x2,y:e.y2}],n=`M${t[0].x},${t[0].y}`;for(let e=0;e<t.length-1;e++){let r=t[e],i=t[e+1],a=Math.max(24,Math.abs(i.x-r.x)/2);n+=` C${r.x+a},${r.y} ${i.x-a},${i.y} ${i.x},${i.y}`}return n}var K=class extends R{constructor(...e){super(...e),this.panel={type:`dag`},this.hover=null}createRenderRoot(){return this}nodes(){return(this.panel.nodes??[]).filter(e=>!!e&&e.id!=null)}legend(){return O`<div class="dk-legend dk-dag-legend">
      ${it.map(([e,t])=>O`<span><i style="background:${rt[e]}"></i>${t}</span>`)}
      <span><i class="dk-dag-elig-key"></i>ready now</span>
    </div>`}render(){let e=this.nodes(),t=this.panel.title?O`<div class="dk-l">${this.panel.title}</div>`:``;if(!e.length)return O`<div class="dk-panel dk-full">${t}<div class="dk-muted">no units to show</div></div>`;let n=Xe(e.map(e=>({id:e.id,dependsOn:e.dependsOn})),this.panel.edges),r=new Map(e.map(e=>[e.id,e])),i=$e(e.map(e=>e.id),n.edges),a=nt(e,i.up),o=this.hover?tt(this.hover,i):null,s=n.edges.map(e=>k`<path class=${`dk-dag-edge${o&&o.has(e.from)&&o.has(e.to)?` on`:``}${e.back?` back`:``}`} d=${ot(e)} marker-end="url(#dk-arrow)"></path>`),c=n.nodes.map(e=>{let t=r.get(e.id),n=at(t.status),i=a.has(e.id),s=o?!o.has(e.id):!1,c=t.action;return k`<g
        class=${`dk-dag-node${s?` dim`:``}${c?` act`:``}`}
        transform=${`translate(${e.x},${e.y})`}
        @mouseenter=${()=>{this.hover=e.id}}
        @mouseleave=${()=>{this.hover=null}}
        @click=${()=>{c&&this.onAction?.(c,t.payload??{id:e.id})}}
      >
        <rect class=${`dk-dag-box${i?` elig`:``}`} width=${e.w} height=${e.h} rx="8"></rect>
        <rect class="dk-dag-tone" x="0" y="0" width="4" height=${e.h} rx="2" fill=${n}></rect>
        <circle cx=${e.w-12} cy="13" r="4" fill=${n}></circle>
        <text class="dk-dag-lbl" x="13" y="18">${W(t.label??e.id,19)}</text>
        <text class="dk-dag-sub" x="13" y="33">${W(t.sub??(i?`ready`:t.status??``),22)}</text>
      </g>`});return O`<div class="dk-panel dk-full">
      ${t}${this.legend()}
      <div class="dk-dag-scroll">
        <svg
          class="dk-dag"
          width=${n.width}
          height=${n.height}
          viewBox="0 0 ${n.width} ${n.height}"
        >
          <defs>
            <marker id="dk-arrow" viewBox="0 0 8 8" refX="7" refY="4" markerWidth="6" markerHeight="6" orient="auto">
              <path class="dk-dag-arrowhead" d="M0,0 L8,4 L0,8 z"></path>
            </marker>
          </defs>
          <g class="dk-dag-edges">${s}</g>
          <g class="dk-dag-nodes">${c}</g>
        </svg>
      </div>
    </div>`}};G([B({attribute:!1})],K.prototype,`panel`,void 0),G([B({attribute:!1})],K.prototype,`onAction`,void 0),G([V()],K.prototype,`hover`,void 0),K=G([z(`dk-dag`)],K);var q=class extends R{constructor(...e){super(...e),this.panel={type:`form`},this.values={},this.dirty=!1}createRenderRoot(){return this}willUpdate(e){if(e.has(`panel`)&&!this.dirty){let e={};for(let t of this.panel.fields??[])e[t.key]=t.value??(t.kind===`checkbox`?!1:``);this.values=e}}set(e,t){this.values={...this.values,[e]:t},this.dirty=!0}field(e){let t=this.values[e.key],n=O`<span class="dk-fl">${e.label??e.key}</span>`;return e.kind===`textarea`?O`<label class="dk-f dk-full"
        >${n}<textarea
          .value=${t==null?``:String(t)}
          @input=${t=>this.set(e.key,t.target.value)}
        ></textarea
      ></label>`:e.kind===`select`?O`<label class="dk-f"
        >${n}<select @change=${t=>this.set(e.key,t.target.value)}>
          ${(e.options??[]).map(e=>O`<option value=${e.value} ?selected=${String(e.value)===String(t)}>${e.label??e.value}</option>`)}
        </select></label
      >`:e.kind===`checkbox`?O`<label class="dk-f dk-fcheck"
        ><input
          type="checkbox"
          .checked=${!!t}
          @change=${t=>this.set(e.key,t.target.checked)}
        />${n}</label
      >`:O`<label class="dk-f"
      >${n}<input
        type=${e.kind===`number`?`number`:`text`}
        .value=${t==null?``:String(t)}
        @input=${t=>{let n=t.target;this.set(e.key,e.kind===`number`?n.value===``?null:Number(n.value):n.value)}}
    /></label>`}submit(){this.onAction?.(this.panel.action??`save`,{...this.panel.context??{},values:this.values}),this.dirty=!1}cancel(){this.dirty=!1,this.panel.cancelAction&&this.onAction?.(this.panel.cancelAction,{})}render(){let e=this.panel;return O`<div class="dk-panel dk-full">
      ${e.title?O`<div class="dk-l">${e.title}</div>`:``}
      <div class="dk-form">${(e.fields??[]).map(e=>this.field(e))}</div>
      <div class="dk-acts">
        <button class="dk-btn" @click=${()=>this.submit()}>${e.submitLabel??`Save`}</button>
        ${e.cancelAction?O`<button class="dk-btn" @click=${()=>this.cancel()}>Cancel</button>`:``}
      </div>
    </div>`}};G([B({attribute:!1})],q.prototype,`panel`,void 0),G([B({attribute:!1})],q.prototype,`onAction`,void 0),G([V()],q.prototype,`values`,void 0),G([V()],q.prototype,`dirty`,void 0),q=G([z(`dk-form`)],q);var st={warm:`var(--dk-accent)`,cool:`var(--dk-c6)`,you:`var(--dk-c1)`,them:`var(--dk-c2)`,ok:`var(--dk-ok)`,err:`var(--dk-err)`},J=class extends R{constructor(...e){super(...e),this.panel={type:`wordcloud`},this.view=`cloud`,this.fkey=null}createRenderRoot(){return this}facets(){return(this.panel.facets??[]).filter(e=>e.terms&&e.terms.length)}current(){let e=this.facets();return e.find(e=>e.key===this.fkey)??e[0]}body(){let e=this.current();if(!e?.terms?.length)return O`<div class="dk-muted">no terms for this lens</div>`;let t=e.legend&&e.legend.length?O`<div class="dk-legend">
            ${e.legend.map(e=>O`<span><i style="background:${st[e.tone??``]??H(0)}"></i>${e.label}</span>`)}
          </div>`:``,n=[...e.terms].sort((e,t)=>(Number(t.weight)||0)-(Number(e.weight)||0));if(this.view===`bars`){let e=n.slice(0,22);return O`${t}${Ue(e.map(e=>e.text),e.map(e=>Number(e.weight)||0))}`}let r=n.map(e=>Number(e.weight)||0),i=Math.max(...r,1),a=Math.min(...r,0),o=i-a||1;return O`${t}<div class="dk-cloud">
      ${n.slice(0,70).map((e,t)=>O`<span style="font-size:${12+Math.round(24*Math.sqrt(((Number(e.weight)||0)-a)/o))}px;color:${e.tone&&st[e.tone]?st[e.tone]:H(e.group==null?t:e.group)}" title=${String(e.weight??``)}>${e.text}</span>`)}
    </div>`}controls(){let e=this.facets(),t=this.current();return O`<div class="dk-wc-ctl">${e.length>1?O`<span class="dk-tg">
            ${e.map(e=>O`<button
                class="dk-tg-b ${e.key===t?.key?`on`:``}"
                @click=${()=>{this.fkey=e.key}}
              >
                ${e.label??e.key}
              </button>`)}
          </span>`:``}${O`<span class="dk-tg">
      ${[`cloud`,`bars`].map(e=>O`<button
          class="dk-tg-b ${e===this.view?`on`:``}"
          @click=${()=>{this.view=e}}
        >
          ${e}
        </button>`)}
    </span>`}</div>`}render(){let e=this.panel,t=this.facets().length>0;return O`<div class="dk-panel dk-full">
      ${e.title?O`<div class="dk-l">${e.title}</div>`:``}${t?this.controls():``}
      <div class="dk-wc-body">${t?this.body():O`<div class="dk-muted">no terms available</div>`}</div>
    </div>`}};G([B({attribute:!1})],J.prototype,`panel`,void 0),G([V()],J.prototype,`view`,void 0),G([V()],J.prototype,`fkey`,void 0),J=G([z(`dk-wordcloud`)],J);var ct=e=>O`<div class="dk-panel dk-full dk-sec">${e.title??``}</div>`,lt=e=>O`
  <div class="dk-panel dk-stat">
    <div class="dk-l">${e.label??``}</div>
    <div class="dk-n">${U(e.value)}${e.sub==null?``:O` <small>${e.sub}</small>`}</div>
    ${e.spark&&e.spark.length?ze(e.spark,H(e.color??0)):``}
  </div>`,ut=e=>{let t=Number(e.max)||0,n=Number(e.value)||0,r=e.pct==null?t?100*n/t:0:Number(e.pct),i=e.text==null?t?`${U(n)} / ${U(t)} · ${r.toFixed(1)}%`:U(n):e.text,a=`${Math.max(0,Math.min(100,r)).toFixed(1)}%`;return O`
    <div class="dk-panel dk-full">
      <div class="dk-l">${e.label??``}</div>
      <div class="dk-bar"><i style="width:${a}"></i></div>
      <div class="dk-sub">${i}</div>
    </div>`},dt=(e,t)=>e[t]===`right`||e[t]===`num`,ft=e=>{let t=e.columns??[],n=e.rows??[],r=e.align??[];return O`
    <div class="dk-panel dk-full">
      ${e.title?O`<div class="dk-l">${e.title}</div>`:``}
      <table class="dk-tbl">
        <thead>
          <tr>
            ${t.map((e,t)=>O`<th class=${dt(r,t)?`num`:``}>${e}</th>`)}
          </tr>
        </thead>
        <tbody>
          ${n.map(e=>O`<tr>
              ${e.map((e,t)=>O`<td class=${dt(r,t)?`num`:``}>
                    ${typeof e==`number`?U(e):e}
                  </td>`)}
            </tr>`)}
        </tbody>
      </table>
    </div>`},pt=e=>O`
  <div class="dk-panel">
    ${e.title?O`<div class="dk-l" style="margin-bottom:6px">${e.title}</div>`:``}
    <div class="dk-kv">
      ${(e.items??[]).map(e=>O`<div class="r">
            <b>${e.k}</b><span>${typeof e.v==`number`?U(e.v):e.v}</span>
          </div>`)}
    </div>
  </div>`,mt=e=>{let t=e.text==null?(e.lines??[]).join(`
`):e.text;return O`
    <div class="dk-panel dk-full">
      ${e.title?O`<div class="dk-l">${e.title}</div>`:``}
      <pre class="dk-log">${t}</pre>
    </div>`},ht=e=>O`<div class="dk-panel"><span class="dk-pill ${e.tone??``}">${e.text??``}</span></div>`,gt=e=>{let t=String(e.text??``).split(/\n\s*\n/).filter(e=>e.trim());return O`
    <div class="dk-panel dk-full dk-prose">
      ${e.title?O`<div class="dk-l">${e.title}</div>`:``}${t.map(e=>O`<p>${e.trim()}</p>`)}
    </div>`},_t=e=>O`<div class="dk-panel dk-full">${Fe(e.html??``)}</div>`,vt=(e,t)=>O`
  <div class="dk-panel dk-full">
    ${e.title?O`<div class="dk-l">${e.title}</div>`:``}
    <div class="dk-acts">
      ${(e.buttons??[]).map(e=>O`<button
          class="dk-btn ${e.tone??``}"
          @click=${()=>t?.(e.action??``,e.payload??{})}
        >
          ${e.label??e.action??`action`}
        </button>`)}
    </div>
  </div>`;function yt(e,t){try{switch(e.type){case`section`:return ct(e);case`stat`:return lt(e);case`progress`:return ut(e);case`chart`:return We(e);case`table`:return ft(e);case`kv`:return pt(e);case`log`:return mt(e);case`badge`:return ht(e);case`prose`:return gt(e);case`html`:return _t(e);case`actions`:return vt(e,t);case`button`:{let n=e;return vt({type:`actions`,title:n.title,buttons:[{label:n.label,action:n.action,payload:n.payload,tone:n.tone}]},t)}case`form`:return O`<dk-form .panel=${e} .onAction=${t}></dk-form>`;case`wordcloud`:return O`<dk-wordcloud .panel=${e}></dk-wordcloud>`;case`dag`:return O`<dk-dag .panel=${e} .onAction=${t}></dk-dag>`;default:return O`<div class="dk-panel dk-full">
          <span class="dk-muted">unknown atom: ${e.type}</span>
        </div>`}}catch(t){let n=t instanceof Error?t.message:String(t);return O`<div class="dk-panel dk-full dk-err">atom error (${e.type}): ${n}</div>`}}var bt=`
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
.dk-f textarea{min-height:84px;resize:vertical} .dk-fcheck{flex-direction:row;align-items:center;gap:7px}
/* stateful atoms wrap a dk-full panel; display:contents promotes that panel to the grid item so it spans the row */
dk-dag,dk-form,dk-wordcloud{display:contents}
.dk-dag-legend{margin:6px 0 0}
.dk-dag-elig-key{background:transparent!important;border:2px solid var(--dk-c6);border-radius:3px}
.dk-dag-scroll{margin-top:6px;border:1px solid var(--dk-line);border-radius:9px;background:var(--dk-bg);overflow:auto;max-height:460px}
svg.dk-dag{display:block}
.dk-dag-edge{fill:none;stroke:var(--dk-line);stroke-width:1.5}
.dk-dag-edge.back{stroke-dasharray:4 3}
.dk-dag-edge.on{stroke:var(--dk-accent);stroke-width:2}
.dk-dag-arrowhead{fill:var(--dk-line)}
.dk-dag-node{transition:opacity .15s ease}
.dk-dag-node.act{cursor:pointer}
.dk-dag-node.dim{opacity:.3}
.dk-dag-box{fill:var(--dk-panel);stroke:var(--dk-line);stroke-width:1}
.dk-dag-box.elig{stroke:var(--dk-c6);stroke-width:2}
.dk-dag-node:hover .dk-dag-box{stroke:var(--dk-accent)}
.dk-dag-lbl{fill:var(--dk-fg);font-size:12px;font-weight:600}
.dk-dag-sub{fill:var(--dk-muted);font-size:11px;font-family:ui-monospace,monospace}`;function xt(){if(typeof document>`u`||document.getElementById(`dk-css`))return;let e=document.createElement(`style`);e.id=`dk-css`,e.textContent=bt,(document.head??document.documentElement).appendChild(e)}function St(e,t,n){xt(),t.classList.add(`dk-root`);let r=e.panels??[];De(O`
      ${e.title?O`<div class="dk-title">${e.title}</div>`:``}
      <div class="dk-panels">${r.map(e=>yt(e,n))}</div>
    `,t)}function Ct(e){let t=(typeof e.mount==`string`?document.querySelector(e.mount):e.mount)??document.body,{actionUrl:n}=e,r=e.onAction??(n?(e,t)=>{fetch(n,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({action:e,payload:t})}).catch(()=>{})}:void 0),i=!1,a,o=async()=>{if(!i){try{let n=await(await fetch(e.renderUrl,{cache:`no-store`})).json();if(i)return;St(n,t,r)}catch{}a=setTimeout(()=>void o(),e.refreshMs??3e3)}};return o(),{stop:()=>{i=!0,a&&clearTimeout(a)}}}var Y=e=>e.status===`live`;function X(e){if(e.state===`starting`)return{word:`starting…`,cls:`starting`};if(e.state===`unhealthy`)return{word:`unhealthy`,cls:`unhealthy`};if(Y(e))return{word:`live`,cls:`live`};let t=e.last_stop_reason;return t&&t.kind===`crash`?{word:`crashed${t.exit==null?``:` (exit ${t.exit})`}`,cls:`crash`}:t&&t.kind===`port-busy`?{word:`port busy`,cls:`crash`}:{word:`stopped`,cls:`stopped`}}var wt=e=>!Y(e)&&(e.cmd?.length??0)>0,Tt=e=>Y(e)&&!!e.controllable&&e.stop!==`leave`,Et={start:`starting…`,stop:`stopping…`,restart:`restarting…`},Dt=e=>Et[e]??Et.start,Z=class extends R{constructor(...e){super(...e),this.entry=null,this.pending=new Map,this.mountSpec=e=>Ct(e),this.framed=null,this.handle=null}createRenderRoot(){return this}emit(e,t){this.dispatchEvent(new CustomEvent(`action`,{detail:{verb:e,id:t},bubbles:!0,composed:!0}))}pendingBtn(e){let t=this.pending.get(e.id);return t?O`<button class="btn pending" disabled>${Dt(t)}</button>`:null}stopMount(){this.handle&&=(this.handle.stop(),null)}disconnectedCallback(){super.disconnectedCallback(),this.stopMount()}updated(){let e=this.entry,t=e?`${e.id}:${e.state??``}:${e.render??``}`:null;if(t!==this.framed&&(this.framed=t,this.stopMount(),e&&Y(e)&&e.render===`spec`)){let t=this.querySelector(`#dkhost`);t&&(this.handle=this.mountSpec({renderUrl:`/api/render?id=${encodeURIComponent(e.id)}`,mount:t,onAction:(t,n)=>this.dispatchEvent(new CustomEvent(`spec-action`,{detail:{id:e.id,action:t,payload:n},bubbles:!0,composed:!0}))}))}}head(e){let t=X(e);return O`<div class="dhead">
      <h2>${e.name??e.id}</h2>
      <span class="pill ${t.cls}">${t.word}</span>
      <span class="why">${e.blurb??``}</span>
      <div class="acts">
        ${this.pendingBtn(e)??O`
          ${wt(e)?O`<button class="btn" @click=${()=>this.emit(`start`,e.id)}>Start</button>`:``}
          ${Tt(e)?O`<button class="btn stop" @click=${()=>this.emit(`stop`,e.id)}>Stop</button>`:``}
          ${e.controllable?O`<button class="btn" @click=${()=>this.emit(`restart`,e.id)}>Restart</button>`:``}
        `}
        ${e.port?O`<a class="btn" href="http://127.0.0.1:${e.port}/" target="_blank" rel="noreferrer">open ↗</a>`:``}
      </div>
    </div>`}body(e){return e.type===`terminal`?O`<div class="pane">
        <h3>Terminal project</h3>
        <div>dod can launch it but cannot observe its window (accepted gap).</div>
      </div>`:e.state===`starting`?O`<div class="pane"><div class="spin"></div>
        <h3>starting ${e.name??e.id}…</h3><pre>${e.log_tail??``}</pre></div>`:e.state===`crashed`||e.state===`unhealthy`?O`<div class="pane">
        <h3 style="color:var(--err)">${X(e).word}</h3>
        <pre>${e.log_tail??``}</pre>
        ${this.pendingBtn(e)??O`<button class="btn" @click=${()=>this.emit(`restart`,e.id)}>Restart</button>`}
      </div>`:Y(e)?e.render===`spec`?O`<div class="dk-host" id="dkhost"></div>`:e.embeddable?O`<iframe id="frame" src="http://127.0.0.1:${e.port}/"></iframe>`:O`<div class="pane">
      <h3>Can't embed ${e.name??e.id}</h3>
      <a class="btn" href="http://127.0.0.1:${e.port}/" target="_blank" rel="noreferrer">open in new tab ↗</a>
    </div>`:O`<div class="pane">
        <h3>${X(e).word}</h3>
        <div>${e.why??``}</div>
        ${this.pendingBtn(e)??(wt(e)?O`<button class="btn" @click=${()=>this.emit(`start`,e.id)}>Start</button>`:O`<div>Start it yourself; dod will adopt the port.</div>`)}
      </div>`}render(){let e=this.entry;return e?O`${this.head(e)}<div class="body">${this.body(e)}</div>`:O`<div class="empty">Select a project on the left.</div>`}};G([B({attribute:!1})],Z.prototype,`entry`,void 0),G([B({attribute:!1})],Z.prototype,`pending`,void 0),Z=G([z(`dod-detail`)],Z);var Q=class extends R{constructor(...e){super(...e),this.entries=[],this.selected=null,this.pending=new Map,this.dragId=null}createRenderRoot(){return this}emit(e,t){this.dispatchEvent(new CustomEvent(e,{detail:t,bubbles:!0,composed:!0}))}button(e){let t=this.pending.get(e.id);return t?O`<button class="btn pending" disabled>${Dt(t)}</button>`:Tt(e)?O`<button
        class="btn stop"
        @click=${t=>{t.stopPropagation(),this.emit(`action`,{verb:`stop`,id:e.id})}}
      >
        Stop
      </button>`:wt(e)?O`<button
        class="btn"
        @click=${t=>{t.stopPropagation(),this.emit(`action`,{verb:`start`,id:e.id})}}
      >
        Start
      </button>`:``}drop(e){let t=this.dragId;this.dragId=null,!(!t||t===e)&&this.emit(`reorder`,{from:t,to:e})}render(){return this.entries.length?O`${this.entries.map(e=>{let t=X(e);return O`<div
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
      </div>`})}`:O`<div class="empty" style="padding:30px">
        No projects. Add a dod.project.json to a project, or register one with the CLI.
      </div>`}};G([B({attribute:!1})],Q.prototype,`entries`,void 0),G([B()],Q.prototype,`selected`,void 0),G([B({attribute:!1})],Q.prototype,`pending`,void 0),Q=G([z(`dod-list`)],Q);function Ot(e,t,n){let r=[...e],i=r.indexOf(t),a=r.indexOf(n);if(i<0||a<0||t===n)return r;let[o]=r.splice(i,1);return r.splice(a,0,o),r}var $=class extends R{constructor(...t){super(...t),this.api=new e(``),this.reload=()=>location.reload(),this.entries=[],this.selected=null,this.pending=new Map,this.stopped=!1}createRenderRoot(){return this}start(e=2e3){this.stopped=!1;let t=async()=>{this.stopped||(await this.refresh(),this.timer=setTimeout(()=>void t(),e))};t()}disconnectedCallback(){super.disconnectedCallback(),this.stopped=!0,this.timer&&clearTimeout(this.timer)}async refresh(){let{entries:e}=await this.api.state();this.entries=e.filter(e=>e.state!==`archived`),this.selected&&!this.entries.some(e=>e.id===this.selected)&&(this.selected=null)}async act(e,t){if(!this.pending.has(t)){this.pending=new Map(this.pending).set(t,e);try{if((await this.api.post(e,{id:t})).error===`forbidden`){this.reload();return}await this.refresh()}finally{let e=new Map(this.pending);e.delete(t),this.pending=e}}}async specAction(e){(await this.api.post(`action`,{id:e.id,action:e.action,payload:e.payload})).error===`forbidden`&&this.reload()}async doReorder(e,t){let n=Ot(this.entries.map(e=>e.id),e,t),r=new Map(n.map((e,t)=>[e,t]));this.entries=[...this.entries].sort((e,t)=>(r.get(e.id)??0)-(r.get(t.id)??0)),await this.api.post(`reorder`,{order:n})}render(){let e=this.entries.filter(Y).length,t=this.entries.find(e=>e.id===this.selected)??null;return O`
      <header>
        <b>dod</b><span class="tagline">project control</span>
        <span class="spacer"></span>
        <span id="count" class="count">${e} live / ${this.entries.length}</span>
      </header>
      <dod-list
        .entries=${this.entries}
        .selected=${this.selected}
        .pending=${this.pending}
        @select=${e=>{this.selected=e.detail}}
        @action=${e=>void this.act(e.detail.verb,e.detail.id)}
        @reorder=${e=>void this.doReorder(e.detail.from,e.detail.to)}
      ></dod-list>
      <dod-detail
        .entry=${t}
        .pending=${this.pending}
        @action=${e=>void this.act(e.detail.verb,e.detail.id)}
        @spec-action=${e=>void this.specAction(e.detail)}
      ></dod-detail>
    `}};G([V()],$.prototype,`entries`,void 0),G([V()],$.prototype,`selected`,void 0),G([V()],$.prototype,`pending`,void 0),$=G([z(`dod-app`)],$);function kt(t=document.body){let n=document.createElement(`dod-app`);return n.api=new e(window.TOKEN??``),t.appendChild(n),n.start(),n}kt()})();