var dashkit=(function(e){Object.defineProperty(e,Symbol.toStringTag,{value:`Module`});var t=globalThis,n=t.ShadowRoot&&(t.ShadyCSS===void 0||t.ShadyCSS.nativeShadow)&&`adoptedStyleSheets`in Document.prototype&&`replace`in CSSStyleSheet.prototype,r=Symbol(),i=new WeakMap,a=class{constructor(e,t,n){if(this._$cssResult$=!0,n!==r)throw Error("CSSResult is not constructable. Use `unsafeCSS` or `css` instead.");this.cssText=e,this.t=t}get styleSheet(){let e=this.o,t=this.t;if(n&&e===void 0){let n=t!==void 0&&t.length===1;n&&(e=i.get(t)),e===void 0&&((this.o=e=new CSSStyleSheet).replaceSync(this.cssText),n&&i.set(t,e))}return e}toString(){return this.cssText}},o=e=>new a(typeof e==`string`?e:e+``,void 0,r),s=(e,r)=>{if(n)e.adoptedStyleSheets=r.map(e=>e instanceof CSSStyleSheet?e:e.styleSheet);else for(let n of r){let r=document.createElement(`style`),i=t.litNonce;i!==void 0&&r.setAttribute(`nonce`,i),r.textContent=n.cssText,e.appendChild(r)}},c=n?e=>e:e=>e instanceof CSSStyleSheet?(e=>{let t=``;for(let n of e.cssRules)t+=n.cssText;return o(t)})(e):e,{is:l,defineProperty:u,getOwnPropertyDescriptor:d,getOwnPropertyNames:f,getOwnPropertySymbols:p,getPrototypeOf:m}=Object,h=globalThis,g=h.trustedTypes,ee=g?g.emptyScript:``,te=h.reactiveElementPolyfillSupport,_=(e,t)=>e,v={toAttribute(e,t){switch(t){case Boolean:e=e?ee:null;break;case Object:case Array:e=e==null?e:JSON.stringify(e)}return e},fromAttribute(e,t){let n=e;switch(t){case Boolean:n=e!==null;break;case Number:n=e===null?null:Number(e);break;case Object:case Array:try{n=JSON.parse(e)}catch{n=null}}return n}},y=(e,t)=>!l(e,t),ne={attribute:!0,type:String,converter:v,reflect:!1,useDefault:!1,hasChanged:y};Symbol.metadata??=Symbol(`metadata`),h.litPropertyMetadata??=new WeakMap;var b=class extends HTMLElement{static addInitializer(e){this._$Ei(),(this.l??=[]).push(e)}static get observedAttributes(){return this.finalize(),this._$Eh&&[...this._$Eh.keys()]}static createProperty(e,t=ne){if(t.state&&(t.attribute=!1),this._$Ei(),this.prototype.hasOwnProperty(e)&&((t=Object.create(t)).wrapped=!0),this.elementProperties.set(e,t),!t.noAccessor){let n=Symbol(),r=this.getPropertyDescriptor(e,n,t);r!==void 0&&u(this.prototype,e,r)}}static getPropertyDescriptor(e,t,n){let{get:r,set:i}=d(this.prototype,e)??{get(){return this[t]},set(e){this[t]=e}};return{get:r,set(t){let a=r?.call(this);i?.call(this,t),this.requestUpdate(e,a,n)},configurable:!0,enumerable:!0}}static getPropertyOptions(e){return this.elementProperties.get(e)??ne}static _$Ei(){if(this.hasOwnProperty(_(`elementProperties`)))return;let e=m(this);e.finalize(),e.l!==void 0&&(this.l=[...e.l]),this.elementProperties=new Map(e.elementProperties)}static finalize(){if(this.hasOwnProperty(_(`finalized`)))return;if(this.finalized=!0,this._$Ei(),this.hasOwnProperty(_(`properties`))){let e=this.properties,t=[...f(e),...p(e)];for(let n of t)this.createProperty(n,e[n])}let e=this[Symbol.metadata];if(e!==null){let t=litPropertyMetadata.get(e);if(t!==void 0)for(let[e,n]of t)this.elementProperties.set(e,n)}this._$Eh=new Map;for(let[e,t]of this.elementProperties){let n=this._$Eu(e,t);n!==void 0&&this._$Eh.set(n,e)}this.elementStyles=this.finalizeStyles(this.styles)}static finalizeStyles(e){let t=[];if(Array.isArray(e)){let n=new Set(e.flat(1/0).reverse());for(let e of n)t.unshift(c(e))}else e!==void 0&&t.push(c(e));return t}static _$Eu(e,t){let n=t.attribute;return!1===n?void 0:typeof n==`string`?n:typeof e==`string`?e.toLowerCase():void 0}constructor(){super(),this._$Ep=void 0,this.isUpdatePending=!1,this.hasUpdated=!1,this._$Em=null,this._$Ev()}_$Ev(){this._$ES=new Promise(e=>this.enableUpdating=e),this._$AL=new Map,this._$E_(),this.requestUpdate(),this.constructor.l?.forEach(e=>e(this))}addController(e){(this._$EO??=new Set).add(e),this.renderRoot!==void 0&&this.isConnected&&e.hostConnected?.()}removeController(e){this._$EO?.delete(e)}_$E_(){let e=new Map,t=this.constructor.elementProperties;for(let n of t.keys())this.hasOwnProperty(n)&&(e.set(n,this[n]),delete this[n]);e.size>0&&(this._$Ep=e)}createRenderRoot(){let e=this.shadowRoot??this.attachShadow(this.constructor.shadowRootOptions);return s(e,this.constructor.elementStyles),e}connectedCallback(){this.renderRoot??=this.createRenderRoot(),this.enableUpdating(!0),this._$EO?.forEach(e=>e.hostConnected?.())}enableUpdating(e){}disconnectedCallback(){this._$EO?.forEach(e=>e.hostDisconnected?.())}attributeChangedCallback(e,t,n){this._$AK(e,n)}_$ET(e,t){let n=this.constructor.elementProperties.get(e),r=this.constructor._$Eu(e,n);if(r!==void 0&&!0===n.reflect){let i=(n.converter?.toAttribute===void 0?v:n.converter).toAttribute(t,n.type);this._$Em=e,i==null?this.removeAttribute(r):this.setAttribute(r,i),this._$Em=null}}_$AK(e,t){let n=this.constructor,r=n._$Eh.get(e);if(r!==void 0&&this._$Em!==r){let e=n.getPropertyOptions(r),i=typeof e.converter==`function`?{fromAttribute:e.converter}:e.converter?.fromAttribute===void 0?v:e.converter;this._$Em=r;let a=i.fromAttribute(t,e.type);this[r]=a??this._$Ej?.get(r)??a,this._$Em=null}}requestUpdate(e,t,n,r=!1,i){if(e!==void 0){let a=this.constructor;if(!1===r&&(i=this[e]),n??=a.getPropertyOptions(e),!((n.hasChanged??y)(i,t)||n.useDefault&&n.reflect&&i===this._$Ej?.get(e)&&!this.hasAttribute(a._$Eu(e,n))))return;this.C(e,t,n)}!1===this.isUpdatePending&&(this._$ES=this._$EP())}C(e,t,{useDefault:n,reflect:r,wrapped:i},a){n&&!(this._$Ej??=new Map).has(e)&&(this._$Ej.set(e,a??t??this[e]),!0!==i||a!==void 0)||(this._$AL.has(e)||(this.hasUpdated||n||(t=void 0),this._$AL.set(e,t)),!0===r&&this._$Em!==e&&(this._$Eq??=new Set).add(e))}async _$EP(){this.isUpdatePending=!0;try{await this._$ES}catch(e){Promise.reject(e)}let e=this.scheduleUpdate();return e!=null&&await e,!this.isUpdatePending}scheduleUpdate(){return this.performUpdate()}performUpdate(){if(!this.isUpdatePending)return;if(!this.hasUpdated){if(this.renderRoot??=this.createRenderRoot(),this._$Ep){for(let[e,t]of this._$Ep)this[e]=t;this._$Ep=void 0}let e=this.constructor.elementProperties;if(e.size>0)for(let[t,n]of e){let{wrapped:e}=n,r=this[t];!0!==e||this._$AL.has(t)||r===void 0||this.C(t,void 0,n,r)}}let e=!1,t=this._$AL;try{e=this.shouldUpdate(t),e?(this.willUpdate(t),this._$EO?.forEach(e=>e.hostUpdate?.()),this.update(t)):this._$EM()}catch(t){throw e=!1,this._$EM(),t}e&&this._$AE(t)}willUpdate(e){}_$AE(e){this._$EO?.forEach(e=>e.hostUpdated?.()),this.hasUpdated||(this.hasUpdated=!0,this.firstUpdated(e)),this.updated(e)}_$EM(){this._$AL=new Map,this.isUpdatePending=!1}get updateComplete(){return this.getUpdateComplete()}getUpdateComplete(){return this._$ES}shouldUpdate(e){return!0}update(e){this._$Eq&&=this._$Eq.forEach(e=>this._$ET(e,this[e])),this._$EM()}updated(e){}firstUpdated(e){}};b.elementStyles=[],b.shadowRootOptions={mode:`open`},b[_(`elementProperties`)]=new Map,b[_(`finalized`)]=new Map,te?.({ReactiveElement:b}),(h.reactiveElementVersions??=[]).push(`2.1.2`);var x=globalThis,re=e=>e,S=x.trustedTypes,ie=S?S.createPolicy(`lit-html`,{createHTML:e=>e}):void 0,ae=`$lit$`,C=`lit$${Math.random().toFixed(9).slice(2)}$`,oe=`?`+C,se=`<${oe}>`,w=document,T=()=>w.createComment(``),E=e=>e===null||typeof e!=`object`&&typeof e!=`function`,D=Array.isArray,ce=e=>D(e)||typeof e?.[Symbol.iterator]==`function`,le=`[ 	
\f\r]`,O=/<(?:(!--|\/[^a-zA-Z])|(\/?[a-zA-Z][^>\s]*)|(\/?$))/g,ue=/-->/g,de=/>/g,k=RegExp(`>|${le}(?:([^\\s"'>=/]+)(${le}*=${le}*(?:[^ \t\n\f\r"'\`<>=]|("|')|))|$)`,`g`),fe=/'/g,pe=/"/g,me=/^(?:script|style|textarea|title)$/i,he=e=>(t,...n)=>({_$litType$:e,strings:t,values:n}),A=he(1),j=he(2),M=Symbol.for(`lit-noChange`),N=Symbol.for(`lit-nothing`),ge=new WeakMap,P=w.createTreeWalker(w,129);function _e(e,t){if(!D(e)||!e.hasOwnProperty(`raw`))throw Error(`invalid template strings array`);return ie===void 0?t:ie.createHTML(t)}var ve=(e,t)=>{let n=e.length-1,r=[],i,a=t===2?`<svg>`:t===3?`<math>`:``,o=O;for(let t=0;t<n;t++){let n=e[t],s,c,l=-1,u=0;for(;u<n.length&&(o.lastIndex=u,c=o.exec(n),c!==null);)u=o.lastIndex,o===O?c[1]===`!--`?o=ue:c[1]===void 0?c[2]===void 0?c[3]!==void 0&&(o=k):(me.test(c[2])&&(i=RegExp(`</`+c[2],`g`)),o=k):o=de:o===k?c[0]===`>`?(o=i??O,l=-1):c[1]===void 0?l=-2:(l=o.lastIndex-c[2].length,s=c[1],o=c[3]===void 0?k:c[3]===`"`?pe:fe):o===pe||o===fe?o=k:o===ue||o===de?o=O:(o=k,i=void 0);let d=o===k&&e[t+1].startsWith(`/>`)?` `:``;a+=o===O?n+se:l>=0?(r.push(s),n.slice(0,l)+ae+n.slice(l)+C+d):n+C+(l===-2?t:d)}return[_e(e,a+(e[n]||`<?>`)+(t===2?`</svg>`:t===3?`</math>`:``)),r]},F=class e{constructor({strings:t,_$litType$:n},r){let i;this.parts=[];let a=0,o=0,s=t.length-1,c=this.parts,[l,u]=ve(t,n);if(this.el=e.createElement(l,r),P.currentNode=this.el.content,n===2||n===3){let e=this.el.content.firstChild;e.replaceWith(...e.childNodes)}for(;(i=P.nextNode())!==null&&c.length<s;){if(i.nodeType===1){if(i.hasAttributes())for(let e of i.getAttributeNames())if(e.endsWith(ae)){let t=u[o++],n=i.getAttribute(e).split(C),r=/([.?@])?(.*)/.exec(t);c.push({type:1,index:a,name:r[2],strings:n,ctor:r[1]===`.`?be:r[1]===`?`?xe:r[1]===`@`?Se:R}),i.removeAttribute(e)}else e.startsWith(C)&&(c.push({type:6,index:a}),i.removeAttribute(e));if(me.test(i.tagName)){let e=i.textContent.split(C),t=e.length-1;if(t>0){i.textContent=S?S.emptyScript:``;for(let n=0;n<t;n++)i.append(e[n],T()),P.nextNode(),c.push({type:2,index:++a});i.append(e[t],T())}}}else if(i.nodeType===8)if(i.data===oe)c.push({type:2,index:a});else{let e=-1;for(;(e=i.data.indexOf(C,e+1))!==-1;)c.push({type:7,index:a}),e+=C.length-1}a++}}static createElement(e,t){let n=w.createElement(`template`);return n.innerHTML=e,n}};function I(e,t,n=e,r){if(t===M)return t;let i=r===void 0?n._$Cl:n._$Co?.[r],a=E(t)?void 0:t._$litDirective$;return i?.constructor!==a&&(i?._$AO?.(!1),a===void 0?i=void 0:(i=new a(e),i._$AT(e,n,r)),r===void 0?n._$Cl=i:(n._$Co??=[])[r]=i),i!==void 0&&(t=I(e,i._$AS(e,t.values),i,r)),t}var ye=class{constructor(e,t){this._$AV=[],this._$AN=void 0,this._$AD=e,this._$AM=t}get parentNode(){return this._$AM.parentNode}get _$AU(){return this._$AM._$AU}u(e){let{el:{content:t},parts:n}=this._$AD,r=(e?.creationScope??w).importNode(t,!0);P.currentNode=r;let i=P.nextNode(),a=0,o=0,s=n[0];for(;s!==void 0;){if(a===s.index){let t;s.type===2?t=new L(i,i.nextSibling,this,e):s.type===1?t=new s.ctor(i,s.name,s.strings,this,e):s.type===6&&(t=new Ce(i,this,e)),this._$AV.push(t),s=n[++o]}a!==s?.index&&(i=P.nextNode(),a++)}return P.currentNode=w,r}p(e){let t=0;for(let n of this._$AV)n!==void 0&&(n.strings===void 0?n._$AI(e[t]):(n._$AI(e,n,t),t+=n.strings.length-2)),t++}},L=class e{get _$AU(){return this._$AM?._$AU??this._$Cv}constructor(e,t,n,r){this.type=2,this._$AH=N,this._$AN=void 0,this._$AA=e,this._$AB=t,this._$AM=n,this.options=r,this._$Cv=r?.isConnected??!0}get parentNode(){let e=this._$AA.parentNode,t=this._$AM;return t!==void 0&&e?.nodeType===11&&(e=t.parentNode),e}get startNode(){return this._$AA}get endNode(){return this._$AB}_$AI(e,t=this){e=I(this,e,t),E(e)?e===N||e==null||e===``?(this._$AH!==N&&this._$AR(),this._$AH=N):e!==this._$AH&&e!==M&&this._(e):e._$litType$===void 0?e.nodeType===void 0?ce(e)?this.k(e):this._(e):this.T(e):this.$(e)}O(e){return this._$AA.parentNode.insertBefore(e,this._$AB)}T(e){this._$AH!==e&&(this._$AR(),this._$AH=this.O(e))}_(e){this._$AH!==N&&E(this._$AH)?this._$AA.nextSibling.data=e:this.T(w.createTextNode(e)),this._$AH=e}$(e){let{values:t,_$litType$:n}=e,r=typeof n==`number`?this._$AC(e):(n.el===void 0&&(n.el=F.createElement(_e(n.h,n.h[0]),this.options)),n);if(this._$AH?._$AD===r)this._$AH.p(t);else{let e=new ye(r,this),n=e.u(this.options);e.p(t),this.T(n),this._$AH=e}}_$AC(e){let t=ge.get(e.strings);return t===void 0&&ge.set(e.strings,t=new F(e)),t}k(t){D(this._$AH)||(this._$AH=[],this._$AR());let n=this._$AH,r,i=0;for(let a of t)i===n.length?n.push(r=new e(this.O(T()),this.O(T()),this,this.options)):r=n[i],r._$AI(a),i++;i<n.length&&(this._$AR(r&&r._$AB.nextSibling,i),n.length=i)}_$AR(e=this._$AA.nextSibling,t){for(this._$AP?.(!1,!0,t);e!==this._$AB;){let t=re(e).nextSibling;re(e).remove(),e=t}}setConnected(e){this._$AM===void 0&&(this._$Cv=e,this._$AP?.(e))}},R=class{get tagName(){return this.element.tagName}get _$AU(){return this._$AM._$AU}constructor(e,t,n,r,i){this.type=1,this._$AH=N,this._$AN=void 0,this.element=e,this.name=t,this._$AM=r,this.options=i,n.length>2||n[0]!==``||n[1]!==``?(this._$AH=Array(n.length-1).fill(new String),this.strings=n):this._$AH=N}_$AI(e,t=this,n,r){let i=this.strings,a=!1;if(i===void 0)e=I(this,e,t,0),a=!E(e)||e!==this._$AH&&e!==M,a&&(this._$AH=e);else{let r=e,o,s;for(e=i[0],o=0;o<i.length-1;o++)s=I(this,r[n+o],t,o),s===M&&(s=this._$AH[o]),a||=!E(s)||s!==this._$AH[o],s===N?e=N:e!==N&&(e+=(s??``)+i[o+1]),this._$AH[o]=s}a&&!r&&this.j(e)}j(e){e===N?this.element.removeAttribute(this.name):this.element.setAttribute(this.name,e??``)}},be=class extends R{constructor(){super(...arguments),this.type=3}j(e){this.element[this.name]=e===N?void 0:e}},xe=class extends R{constructor(){super(...arguments),this.type=4}j(e){this.element.toggleAttribute(this.name,!!e&&e!==N)}},Se=class extends R{constructor(e,t,n,r,i){super(e,t,n,r,i),this.type=5}_$AI(e,t=this){if((e=I(this,e,t,0)??N)===M)return;let n=this._$AH,r=e===N&&n!==N||e.capture!==n.capture||e.once!==n.once||e.passive!==n.passive,i=e!==N&&(n===N||r);r&&this.element.removeEventListener(this.name,this,n),i&&this.element.addEventListener(this.name,this,e),this._$AH=e}handleEvent(e){typeof this._$AH==`function`?this._$AH.call(this.options?.host??this.element,e):this._$AH.handleEvent(e)}},Ce=class{constructor(e,t,n){this.element=e,this.type=6,this._$AN=void 0,this._$AM=t,this.options=n}get _$AU(){return this._$AM._$AU}_$AI(e){I(this,e)}},we={M:ae,P:C,A:oe,C:1,L:ve,R:ye,D:ce,V:I,I:L,H:R,N:xe,U:Se,B:be,F:Ce},Te=x.litHtmlPolyfillSupport;Te?.(F,L),(x.litHtmlVersions??=[]).push(`3.3.3`);var z=(e,t,n)=>{let r=n?.renderBefore??t,i=r._$litPart$;if(i===void 0){let e=n?.renderBefore??null;r._$litPart$=i=new L(t.insertBefore(T(),e),e,void 0,n??{})}return i._$AI(e),i},Ee=globalThis,B=class extends b{constructor(){super(...arguments),this.renderOptions={host:this},this._$Do=void 0}createRenderRoot(){let e=super.createRenderRoot();return this.renderOptions.renderBefore??=e.firstChild,e}update(e){let t=this.render();this.hasUpdated||(this.renderOptions.isConnected=this.isConnected),super.update(e),this._$Do=z(t,this.renderRoot,this.renderOptions)}connectedCallback(){super.connectedCallback(),this._$Do?.setConnected(!0)}disconnectedCallback(){super.disconnectedCallback(),this._$Do?.setConnected(!1)}render(){return M}};B._$litElement$=!0,B.finalized=!0,Ee.litElementHydrateSupport?.({LitElement:B});var De=Ee.litElementPolyfillSupport;De?.({LitElement:B}),(Ee.litElementVersions??=[]).push(`4.2.2`);var Oe={ATTRIBUTE:1,CHILD:2,PROPERTY:3,BOOLEAN_ATTRIBUTE:4,EVENT:5,ELEMENT:6},ke=e=>(...t)=>({_$litDirective$:e,values:t}),Ae=class{constructor(e){}get _$AU(){return this._$AM._$AU}_$AT(e,t,n){this._$Ct=e,this._$AM=t,this._$Ci=n}_$AS(e,t){return this.update(e,t)}update(e,t){return this.render(...t)}},{I:je}=we,Me=e=>e,Ne=()=>document.createComment(``),V=(e,t,n)=>{let r=e._$AA.parentNode,i=t===void 0?e._$AB:t._$AA;if(n===void 0)n=new je(r.insertBefore(Ne(),i),r.insertBefore(Ne(),i),e,e.options);else{let t=n._$AB.nextSibling,a=n._$AM,o=a!==e;if(o){let t;n._$AQ?.(e),n._$AM=e,n._$AP!==void 0&&(t=e._$AU)!==a._$AU&&n._$AP(t)}if(t!==i||o){let e=n._$AA;for(;e!==t;){let t=Me(e).nextSibling;Me(r).insertBefore(e,i),e=t}}}return n},H=(e,t,n=e)=>(e._$AI(t,n),e),Pe={},Fe=(e,t=Pe)=>e._$AH=t,Ie=e=>e._$AH,U=e=>{e._$AR(),e._$AA.remove()},Le=(e,t,n)=>{let r=new Map;for(let i=t;i<=n;i++)r.set(e[i],i);return r},Re=ke(class extends Ae{constructor(e){if(super(e),e.type!==Oe.CHILD)throw Error(`repeat() can only be used in text expressions`)}dt(e,t,n){let r;n===void 0?n=t:t!==void 0&&(r=t);let i=[],a=[],o=0;for(let t of e)i[o]=r?r(t,o):o,a[o]=n(t,o),o++;return{values:a,keys:i}}render(e,t,n){return this.dt(e,t,n).values}update(e,[t,n,r]){let i=Ie(e),{values:a,keys:o}=this.dt(t,n,r);if(!Array.isArray(i))return this.ut=o,a;let s=this.ut??=[],c=[],l,u,d=0,f=i.length-1,p=0,m=a.length-1;for(;d<=f&&p<=m;)if(i[d]===null)d++;else if(i[f]===null)f--;else if(s[d]===o[p])c[p]=H(i[d],a[p]),d++,p++;else if(s[f]===o[m])c[m]=H(i[f],a[m]),f--,m--;else if(s[d]===o[m])c[m]=H(i[d],a[m]),V(e,c[m+1],i[d]),d++,m--;else if(s[f]===o[p])c[p]=H(i[f],a[p]),V(e,i[d],i[f]),f--,p++;else if(l===void 0&&(l=Le(o,p,m),u=Le(s,d,f)),l.has(s[d]))if(l.has(s[f])){let t=u.get(o[p]),n=t===void 0?null:i[t];if(n===null){let t=V(e,i[d]);H(t,a[p]),c[p]=t}else c[p]=H(n,a[p]),V(e,i[d],n),i[t]=null;p++}else U(i[f]),f--;else U(i[d]),d++;for(;p<=m;){let t=V(e,c[m+1]);H(t,a[p]),c[p++]=t}for(;d<=f;){let e=i[d++];e!==null&&U(e)}return this.ut=o,Fe(e,c),M}}),ze=class extends Ae{constructor(e){if(super(e),this.it=N,e.type!==Oe.CHILD)throw Error(this.constructor.directiveName+`() can only be used in child bindings`)}render(e){if(e===N||e==null)return this._t=void 0,this.it=e;if(e===M)return e;if(typeof e!=`string`)throw Error(this.constructor.directiveName+`() called with a non-string value`);if(e===this.it)return this._t;this.it=e;let t=[e];return t.raw=t,this._t={_$litType$:this.constructor.resultType,strings:t,values:[]}}};ze.directiveName=`unsafeHTML`,ze.resultType=1;var Be=ke(ze),Ve=[`var(--dk-c1)`,`var(--dk-c2)`,`var(--dk-c3)`,`var(--dk-c4)`,`var(--dk-c5)`,`var(--dk-c6)`],W=e=>Ve[((Number(e)||0)%6+6)%6];function G(e){return e==null?`–`:typeof e==`number`?Number.isFinite(e)?Number.isInteger(e)?e.toLocaleString():Math.abs(e)>=1e3?e.toLocaleString(void 0,{maximumFractionDigits:1}):e.toFixed(2):`–`:String(e)}function He(e){let t=Number(e)||0,n=Math.abs(t);return n>=1e9?`${(t/1e9).toFixed(1)}B`:n>=1e6?`${(t/1e6).toFixed(1)}M`:n>=1e3?`${(t/1e3).toFixed(1)}k`:Number.isInteger(t)?String(t):t.toFixed(2)}function Ue(e){return typeof e==`string`&&/^\d{4}-\d{2}-\d{2}/.test(e)?e.slice(0,10):String(e)}function K(e,t){let n=String(e);return n.length>t?`${n.slice(0,t-1)}…`:n}function We(e,t){let n=e.length,r=e.filter(e=>e!=null&&Number.isFinite(e));if(r.length<2)return A`<svg viewBox="0 0 ${240} ${46}"></svg>`;let i=Math.min(...r),a=Math.max(...r)-i||1,o=e=>4+e/(n-1)*232,s=e=>42-(e-i)/a*38,c=``,l=!1;return e.forEach((e,t)=>{if(e==null||!Number.isFinite(e)){l=!1;return}c+=`${l?`L`:`M`}${o(t).toFixed(1)},${s(e).toFixed(1)} `,l=!0}),A`<svg viewBox="0 0 ${240} ${46}" preserveAspectRatio="none">
    <path d=${c} fill="none" stroke=${t} stroke-width="1.6"></path>
  </svg>`}var Ge=e=>e===`accent`?`var(--dk-accent)`:e===`err`?`var(--dk-err)`:e===`ok`?`var(--dk-ok)`:`var(--dk-muted)`;function Ke(e,t,n,r){let i={l:60,r:14,t:22,b:72},a=820-i.l-i.r,o=340-i.t-i.b,s=t.length,c=n.length>1,l=0;if(e===`stacked`)for(let e=0;e<s;e++){let t=0;n.forEach(n=>{t+=Math.max(0,Number(n.values[e])||0)}),l=Math.max(l,t)}else n.forEach(e=>e.values.forEach(e=>{l=Math.max(l,Number(e)||0)}));l||=1;let u=e=>i.t+o-e/l*o,d=a/Math.max(1,s),f=e=>i.l+d*e+d/2,p=[];for(let e=0;e<=4;e++){let t=l*e/4,n=u(t);p.push(j`<line class="dk-grid" x1=${i.l} y1=${n} x2=${i.l+a} y2=${n}></line>
      <text class="dk-tick" x=${i.l-8} y=${n+4} text-anchor="end">${He(t)}</text>`)}let m=s>18?Math.ceil(s/18):1;for(let e=0;e<s;e++){if(e%m)continue;let n=f(e),r=i.t+o+15;p.push(j`<text class="dk-tick" x=${n} y=${r} text-anchor="end" transform=${`rotate(-35 ${n} ${r})`}>${K(Ue(t[e]),18)}</text>`)}if(e===`bar`||e===`stacked`){let t=n.length;if(e===`stacked`)for(let e=0;e<s;e++){let t=0;n.forEach((n,r)=>{let i=Math.max(0,Number(n.values[e])||0),a=u(t),o=u(t+i);t+=i;let s=d*.7;p.push(j`<rect x=${f(e)-s/2} y=${o} width=${s} height=${Math.max(0,a-o)} fill=${W(r)}></rect>`)})}else{let e=d*.72,r=c?e/t:e;for(let t=0;t<s;t++)n.forEach((n,a)=>{let s=u(Math.max(0,Number(n.values[t])||0)),l=c?f(t)-e/2+a*r:f(t)-e/2;p.push(j`<rect x=${l} y=${s} width=${Math.max(1,r-(c?1.5:0))} height=${Math.max(0,i.t+o-s)} fill=${W(c?a:0)}></rect>`)})}}else n.forEach((t,n)=>{let r=t.values.map((e,t)=>`${f(t)},${u(Math.max(0,Number(e)||0))}`).join(` `);e===`area`&&!c&&p.push(j`<polygon points=${`${f(0)},${i.t+o} ${r} ${f(s-1)},${i.t+o}`} fill=${W(0)} opacity=".18"></polygon>`),p.push(j`<polyline points=${r} fill="none" stroke=${W(n)} stroke-width="2"></polyline>`),t.values.forEach((e,t)=>p.push(j`<circle cx=${f(t)} cy=${u(Math.max(0,Number(e)||0))} r="2.6" fill=${W(n)}></circle>`))});return p.push(j`<line class="dk-axis" x1=${i.l} y1=${i.t+o} x2=${i.l+a} y2=${i.t+o}></line>
    <line class="dk-axis" x1=${i.l} y1=${i.t} x2=${i.l} y2=${i.t+o}></line>`),(r??[]).forEach(e=>{let n=t.indexOf(e.x);if(n<0)return;let r=f(n),a=Ge(e.tone);p.push(j`<line x1=${r} y1=${i.t} x2=${r} y2=${i.t+o} stroke=${a} stroke-width="1" stroke-dasharray="3 3" opacity=".85"></line>`),e.label&&p.push(j`<text x=${r} y=${i.t-6} text-anchor="middle" class="dk-tick" fill=${a}>${e.label}</text>`)}),A`<svg viewBox="0 0 ${820} ${340}">${p}</svg>${c?A`<div class="dk-legend">
        ${n.map((e,t)=>A`<span><i style="background:${W(t)}"></i>${e.name??``}</span>`)}
      </div>`:``}`}function qe(e,t,n,r){let i={l:140,r:70,t:8,b:20},a=e.length,o=i.t+i.b+a*30,s=820-i.l-i.r,c=i.l+s/2,l=s/2,u=[j`<line class="dk-axis" x1=${c} y1=${i.t} x2=${c} y2=${i.t+a*30}></line>`];return t.forEach((t,n)=>{let r=Math.max(-1,Math.min(1,Number(t)||0)),a=i.t+n*30,o=Math.abs(r)*l,s=r>=0?c:c-o,d=r>=0?`var(--dk-c1)`:`var(--dk-c2)`;u.push(j`<text class="dk-tick" x=${i.l-10} y=${a+30/2+4} text-anchor="end">${K(e[n],20)}</text>
      <rect x=${s} y=${a+5} width=${Math.max(1,o)} height=${18} rx="2" fill=${d}></rect>
      <text class="dk-cval" x=${r>=0?c+o+6:c-o-6} y=${a+30/2+4} text-anchor=${r>=0?`start`:`end`}>${r>0?`+`:``}${r.toFixed(2)}</text>`)}),u.push(j`<text class="dk-tick" x=${i.l} y=${i.t+a*30+14} text-anchor="start">← ${n??`them`}</text>
    <text class="dk-tick" x=${i.l+s} y=${i.t+a*30+14} text-anchor="end">${r??`you`} →</text>`),A`<svg viewBox="0 0 ${820} ${o}">${u}</svg>`}function Je(e,t){let n={l:210,r:64,t:6,b:6},r=e.length,i=n.t+n.b+r*22,a=820-n.l-n.r,o=Math.max(...t.map(e=>Number(e)||0),0)||1,s=[];return t.forEach((t,r)=>{let i=n.t+r*22,c=Math.max(0,(Number(t)||0)/o*a);s.push(j`<text class="dk-tick" x=${n.l-8} y=${i+22/2+4} text-anchor="end">${K(Ue(e[r]),30)}</text>
      <rect x=${n.l} y=${i+3} width=${c} height=${16} fill=${W(0)}></rect>
      <text class="dk-cval" x=${n.l+c+6} y=${i+22/2+4}>${He(Number(t)||0)}</text>`)}),A`<svg viewBox="0 0 ${820} ${i}">${s}</svg>`}function Ye(e){let t=e.kind??`line`,n=e.series??(e.values?[{name:e.label??``,values:e.values}]:[]),r=e.x??(n[0]?n[0].values.map((e,t)=>t):[]),i=n[0]?.values??[],a;return a=t===`spark`?We(i,W(e.color??0)):t===`diverging`?qe(r,i,e.left,e.right):t===`hbar`?Je(r,i):Ke(t===`bars`?`bar`:t===`stacked`?`stacked`:t===`area`?`area`:`line`,r,n,e.markers),A`<div class="dk-panel dk-chart ${t===`spark`?``:`dk-full`}">
    ${e.title?A`<div class="dk-l">${e.title}</div>`:``}${a}
  </div>`}var Xe=e=>(t,n)=>{n===void 0?customElements.define(e,t):n.addInitializer(()=>{customElements.define(e,t)})},Ze={attribute:!0,type:String,converter:v,reflect:!1,hasChanged:y},Qe=(e=Ze,t,n)=>{let{kind:r,metadata:i}=n,a=globalThis.litPropertyMetadata.get(i);if(a===void 0&&globalThis.litPropertyMetadata.set(i,a=new Map),r===`setter`&&((e=Object.create(e)).wrapped=!0),a.set(n.name,e),r===`accessor`){let{name:r}=n;return{set(n){let i=t.get.call(this);t.set.call(this,n),this.requestUpdate(r,i,e,!0,n)},init(t){return t!==void 0&&this.C(r,void 0,e,t),t}}}if(r===`setter`){let{name:r}=n;return function(n){let i=this[r];t.call(this,n),this.requestUpdate(r,i,e,!0,n)}}throw Error(`Unsupported decorator location: `+r)};function q(e){return(t,n)=>typeof n==`object`?Qe(e,t,n):((e,t,n)=>{let r=t.hasOwnProperty(n);return t.constructor.createProperty(n,e),r?Object.getOwnPropertyDescriptor(t,n):void 0})(e,t,n)}function J(e){return q({...e,state:!0,attribute:!1})}var $e={nodeH:42,minW:88,scale:96,gap:12,rowGap:14,pad:16};function et(e,t=[]){let n=new Set(e.map(e=>e.id)),r=new Set,i=[],a=(e,t)=>{if(e===t||!n.has(e)||!n.has(t))return;let a=`${e} ${t}`;r.has(a)||(r.add(a),i.push({from:e,to:t}))};for(let e of t)a(e.from,e.to);for(let t of e)for(let e of t.dependsOn??[])a(e,t.id);return i}function tt(e,t){let n=new Map,r=new Map;for(let t of e)n.set(t,0),r.set(t,[]);for(let e of t)r.get(e.from).push(e.to),n.set(e.to,n.get(e.to)+1);let i=new Map,a=e.filter(e=>n.get(e)===0);for(let e of a)i.set(e,0);let o=0;for(;a.length;){let e=[];for(let t of a){o++;let a=i.get(t);for(let o of r.get(t)){i.set(o,Math.max(i.get(o)??0,a+1));let t=n.get(o)-1;n.set(o,t),t===0&&e.push(o)}}a=e}if(o<e.length){let t=0;for(let e of i.values())t=Math.max(t,e);for(let n of e)i.has(n)||i.set(n,t+1)}return i}function nt(e,t,n,r){let i=new Map,a=new Map;for(let t of e)i.set(t,[]),a.set(t,[]);for(let e of t)n.get(e.to)>n.get(e.from)&&(a.get(e.from).push(e.to),i.get(e.to).push(e.from));let o=[...e].sort((e,t)=>n.get(e)-n.get(t)),s=new Map;for(let e of o)s.set(e,Math.max(0,...i.get(e).map(e=>s.get(e)+r(e))));let c=Math.max(0,...e.map(e=>s.get(e)+r(e))),l=new Map,u=new Map;for(let e of[...o].reverse()){let t=a.get(e).length?Math.min(...a.get(e).map(e=>l.get(e)-r(e))):c;l.set(e,t),u.set(e,Math.max(0,t-r(e)-s.get(e)))}return{asap:s,slack:u}}function rt(e,t,n){let r=(t.get(e)??[]).map(e=>n.get(e)).filter(e=>e!=null);return r.length?r.reduce((e,t)=>e+t,0)/r.length:n.get(e)??0}function it(e,t=[],n={}){let r={...$e,...n};if(!e.length)return{nodes:[],edges:[],width:0,height:0};let i=e.map(e=>e.id),a=et(e,t),o=tt(i,a),s=new Map(e.map(e=>[e.id,Number.isFinite(e.weight)?Number(e.weight):1])),c=e=>Math.max(.1,s.get(e)??1),{asap:l,slack:u}=nt(i,a,o,c),d=r.nodeH+r.rowGap,f=e=>r.pad+l.get(e)*r.scale,p=e=>Math.max(r.minW,c(e)*r.scale-r.gap),m=new Map(i.map(e=>[e,[]]));for(let e of a)o.get(e.to)>o.get(e.from)&&m.get(e.to).push(e.from);let h=new Map,g=(e,t)=>{h.clear();let n=[];for(let i of e){let e=f(i),a=t(i),o=-1,s=1/0;for(let t=0;t<n.length;t++)n[t]<=e-r.gap&&Math.abs(t-a)<s&&(s=Math.abs(t-a),o=t);o===-1&&(o=n.length,n.push(0)),n[o]=e+p(i),h.set(i,o)}},ee=e=>(t,n)=>f(t)-f(n)||e(t)-e(n)||t.localeCompare(n);g([...i].sort(ee(()=>0)),()=>0);let te=new Map(h);g([...i].sort(ee(e=>rt(e,m,te))),e=>rt(e,m,te));let _=i.map(e=>{let t=f(e),n=p(e),i=u.get(e);return{id:e,rank:o.get(e),lane:h.get(e),x:t,y:r.pad+h.get(e)*d,w:n,h:r.nodeH,slack:Math.round(i*100)/100,floatEndX:t+n+i*r.scale,critical:i<.01}}),v=new Set(_.filter(e=>e.critical).map(e=>e.id)),y=e=>r.pad+h.get(e)*d+r.nodeH/2,ne=a.map(e=>({from:e.from,to:e.to,x1:f(e.from)+p(e.from),y1:y(e.from),x2:f(e.to),y2:y(e.to),back:o.get(e.from)>=o.get(e.to),critical:v.has(e.from)&&v.has(e.to)})),b=Math.max(1,..._.map(e=>e.lane+1));return{nodes:_,edges:ne,width:Math.max(0,..._.map(e=>Math.max(e.x+e.w,e.floatEndX)))+r.pad,height:r.pad*2+b*r.nodeH+(b-1)*r.rowGap}}var at={queued:{bucket:`idle`,satisfies:!1,notBegun:!0},pending:{bucket:`idle`,satisfies:!1,notBegun:!0},planning:{bucket:`active`,satisfies:!1,notBegun:!1},"in-cycle":{bucket:`active`,satisfies:!1,notBegun:!1},"in-progress":{bucket:`active`,satisfies:!1,notBegun:!1},green:{bucket:`good`,satisfies:!0,notBegun:!1},landed:{bucket:`good`,satisfies:!0,notBegun:!1},committed:{bucket:`good`,satisfies:!0,notBegun:!1},done:{bucket:`good`,satisfies:!0,notBegun:!1},blocked:{bucket:`warn`,satisfies:!1,notBegun:!1},"needs-hitl":{bucket:`warn`,satisfies:!1,notBegun:!1},error:{bucket:`err`,satisfies:!1,notBegun:!1}},ot={bucket:`idle`,satisfies:!1,notBegun:!1},st=e=>at[(e??``).toLowerCase()]??ot,ct=e=>st(e).bucket,lt=e=>st(e).satisfies,ut=e=>st(e).notBegun;function dt(e,t){let n=new Map,r=new Map;for(let t of e)n.set(t,[]),r.set(t,[]);for(let e of t)!n.has(e.from)||!n.has(e.to)||(r.get(e.from).push(e.to),n.get(e.to).push(e.from));return{up:n,down:r}}function ft(e,t){let n=new Set,r=[e];for(;r.length;){let e=r.pop();for(let i of t.get(e)??[])n.has(i)||(n.add(i),r.push(i))}return n}function pt(e,t){return new Set([e,...ft(e,t.up),...ft(e,t.down)])}function mt(e,t){let n=new Set(e.filter(e=>lt(e.status)).map(e=>e.id)),r=new Set;for(let i of e)ut(i.status)&&(t.get(i.id)??[]).every(e=>n.has(e))&&r.add(i.id);return r}function Y(e,t,n,r){var i=arguments.length,a=i<3?t:r===null?r=Object.getOwnPropertyDescriptor(t,n):r,o;if(typeof Reflect==`object`&&typeof Reflect.decorate==`function`)a=Reflect.decorate(e,t,n,r);else for(var s=e.length-1;s>=0;s--)(o=e[s])&&(a=(i<3?o(a):i>3?o(t,n,a):o(t,n))||a);return i>3&&a&&Object.defineProperty(t,n,a),a}var ht={idle:`var(--dk-muted)`,active:`var(--dk-accent)`,good:`var(--dk-ok)`,warn:`var(--dk-warn)`,err:`var(--dk-err)`},gt=[[`idle`,`queued`],[`active`,`in progress`],[`good`,`done`],[`warn`,`blocked`],[`err`,`error`]],_t=e=>ht[ct(e)];function vt(e){let t=Math.max(24,Math.abs(e.x2-e.x1)/2);return`M${e.x1},${e.y1} C${e.x1+t},${e.y1} ${e.x2-t},${e.y2} ${e.x2},${e.y2}`}var X=class extends B{constructor(...e){super(...e),this.panel={type:`dag`},this.hover=null,this.sel=null}createRenderRoot(){return this}nodes(){return(this.panel.nodes??[]).filter(e=>!!e&&e.id!=null)}legend(){return A`<div class="dk-legend dk-dag-legend">
      ${gt.map(([e,t])=>A`<span><i style="background:${ht[e]}"></i>${t}</span>`)}
      <span><i class="dk-dag-elig-key"></i>ready now</span>
      <span><i class="dk-dag-crit-key"></i>critical path</span>
      <span><i class="dk-dag-float-key"></i>float</span>
    </div>`}render(){let e=this.nodes(),t=this.panel.title?A`<div class="dk-l">${this.panel.title}</div>`:``;if(!e.length)return A`<div class="dk-panel dk-full">${t}<div class="dk-muted">no units to show</div></div>`;let n=it(e.map(e=>({id:e.id,dependsOn:e.dependsOn,weight:e.weight})),this.panel.edges),r=new Map(e.map(e=>[e.id,e])),i=dt(e.map(e=>e.id),n.edges),a=mt(e,i.up),o=this.hover?pt(this.hover,i):null,s=this.sel&&r.has(this.sel)?this.sel:null,c=n.nodes.filter(e=>e.floatEndX>e.x+e.w+1).map(e=>j`<rect
          class=${`dk-dag-float${o&&!o.has(e.id)?` dim`:``}`}
          x=${e.x+e.w} y=${e.y+e.h/2-3}
          width=${e.floatEndX-(e.x+e.w)} height="6" rx="3"></rect>`),l=n.edges.map(e=>j`<path class=${`dk-dag-edge${o&&o.has(e.from)&&o.has(e.to)?` on`:``}${e.back?` back`:``}${e.critical?` crit`:``}`} d=${vt(e)} marker-end="url(#dk-arrow)"></path>`),u=n.nodes.map(e=>{let t=r.get(e.id),n=_t(t.status),i=a.has(e.id),c=o?!o.has(e.id):!1,l=t.action,u=s===e.id,d=`dk-dag-node act${c?` dim`:``}${e.critical?` crit`:``}${u?` sel`:``}`,f=Math.max(4,Math.floor((e.w-22)/6.2));return j`<g
        class=${d}
        data-id=${e.id}
        transform=${`translate(${e.x},${e.y})`}
        @click=${()=>{this.sel=e.id,l&&this.onAction?.(l,t.payload??{id:e.id})}}
      >
        <rect class=${`dk-dag-box${i?` elig`:``}`} width=${e.w} height=${e.h} rx="8"></rect>
        <rect class="dk-dag-tone" x="0" y="0" width="4" height=${e.h} rx="2" fill=${n}></rect>
        <circle cx=${e.w-12} cy="13" r="4" fill=${n}></circle>
        <text class="dk-dag-lbl" x="13" y="18">${K(t.label??e.id,f)}</text>
        <text class="dk-dag-sub" x="13" y="33">${K(t.sub??(i?`ready`:t.status??``),f+3)}</text>
      </g>`});return A`<div class="dk-panel dk-full">
      ${t}${this.legend()}
      <div class="dk-dag-body">
        <div
          class="dk-dag-scroll"
          @mouseover=${e=>this.onHover(e)}
          @mouseleave=${()=>{this.hover=null}}
        >
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
            <g class="dk-dag-floats">${c}</g>
            <g class="dk-dag-edges">${l}</g>
            <g class="dk-dag-nodes">${u}</g>
          </svg>
        </div>
        ${this.inspector(s,r,i,a)}
      </div>
    </div>`}inspector(e,t,n,r){if(!e)return A`<aside class="dk-dag-insp empty">
        <div class="dk-dag-insp-hint">Select a unit to see its detail.</div>
      </aside>`;let i=t.get(e),a=i.detail??{},o=e=>A`<button
        class="dk-dag-chip"
        title=${t.get(e)?.label??e}
        @click=${()=>{this.sel=e}}
      >${e}</button>`,s=n.up.get(e)??[],c=n.down.get(e)??[],l=r.has(e),u=l?`ready now`:i.status??`unknown`,d=l?`var(--dk-ready)`:_t(i.status);return A`<aside class="dk-dag-insp">
      <div class="dk-dag-insp-head">
        <span class="dk-dag-insp-id">${e}</span>
        <button class="dk-dag-insp-x" title="Close" @click=${()=>this.sel=null}>×</button>
      </div>
      <div class="dk-dag-insp-title">${i.label??e}</div>
      <div class="dk-dag-insp-chips">
        <span class="dk-dag-state" style="color:${d};border-color:${d}">${u}</span>
      </div>
      ${a.facts&&a.facts.length?A`<dl class="dk-dag-facts">
            ${a.facts.map(e=>A`<div><dt>${e.k}</dt><dd>${e.v}</dd></div>`)}
          </dl>`:``}
      ${a.note?A`<p class="dk-dag-insp-note">${a.note}</p>`:``}
      ${a.refs&&a.refs.length?A`<div class="dk-dag-insp-sec">
            <div class="dk-l">sources</div>
            ${a.refs.map(e=>A`<div class="dk-dag-ref">
                ${e.href?A`<a href=${e.href} target="_blank" rel="noopener noreferrer">${e.label}</a>`:A`<span class="dk-dag-ref-l">${e.label}</span>`}
                ${e.text?A`<div class="dk-dag-ref-t">${e.text}</div>`:``}
              </div>`)}
          </div>`:``}
      ${s.length?A`<div class="dk-dag-insp-sec">
            <div class="dk-l">waits on</div>
            <div class="dk-dag-chips">${s.map(o)}</div>
          </div>`:``}
      ${c.length?A`<div class="dk-dag-insp-sec">
            <div class="dk-l">unblocks</div>
            <div class="dk-dag-chips">${c.map(o)}</div>
          </div>`:``}
    </aside>`}onHover(e){let t=(e.target?.closest?.(`g.dk-dag-node`))?.getAttribute(`data-id`)??null;t!==this.hover&&(this.hover=t)}};Y([q({attribute:!1})],X.prototype,`panel`,void 0),Y([q({attribute:!1})],X.prototype,`onAction`,void 0),Y([J()],X.prototype,`hover`,void 0),Y([J()],X.prototype,`sel`,void 0),X=Y([Xe(`dk-dag`)],X);var Z=class extends B{constructor(...e){super(...e),this.panel={type:`form`},this.values={},this.dirty=!1}createRenderRoot(){return this}willUpdate(e){if(e.has(`panel`)&&!this.dirty){let e={};for(let t of this.panel.fields??[])e[t.key]=t.value??(t.kind===`checkbox`?!1:``);this.values=e}}set(e,t){this.values={...this.values,[e]:t},this.dirty=!0}field(e){let t=this.values[e.key],n=A`<span class="dk-fl">${e.label??e.key}</span>`;return e.kind===`textarea`?A`<label class="dk-f dk-full"
        >${n}<textarea
          .value=${t==null?``:String(t)}
          @input=${t=>this.set(e.key,t.target.value)}
        ></textarea
      ></label>`:e.kind===`select`?A`<label class="dk-f"
        >${n}<select @change=${t=>this.set(e.key,t.target.value)}>
          ${(e.options??[]).map(e=>A`<option value=${e.value} ?selected=${String(e.value)===String(t)}>${e.label??e.value}</option>`)}
        </select></label
      >`:e.kind===`checkbox`?A`<label class="dk-f dk-fcheck"
        ><input
          type="checkbox"
          .checked=${!!t}
          @change=${t=>this.set(e.key,t.target.checked)}
        />${n}</label
      >`:A`<label class="dk-f"
      >${n}<input
        type=${e.kind===`number`?`number`:`text`}
        .value=${t==null?``:String(t)}
        @input=${t=>{let n=t.target;this.set(e.key,e.kind===`number`?n.value===``?null:Number(n.value):n.value)}}
    /></label>`}submit(){this.onAction?.(this.panel.action??`save`,{...this.panel.context??{},values:this.values}),this.dirty=!1}cancel(){this.dirty=!1,this.panel.cancelAction&&this.onAction?.(this.panel.cancelAction,{})}render(){let e=this.panel;return A`<div class="dk-panel dk-full">
      ${e.title?A`<div class="dk-l">${e.title}</div>`:``}
      <div class="dk-form">${(e.fields??[]).map(e=>this.field(e))}</div>
      <div class="dk-acts">
        <button class="dk-btn" @click=${()=>this.submit()}>${e.submitLabel??`Save`}</button>
        ${e.cancelAction?A`<button class="dk-btn" @click=${()=>this.cancel()}>Cancel</button>`:``}
      </div>
    </div>`}};Y([q({attribute:!1})],Z.prototype,`panel`,void 0),Y([q({attribute:!1})],Z.prototype,`onAction`,void 0),Y([J()],Z.prototype,`values`,void 0),Y([J()],Z.prototype,`dirty`,void 0),Z=Y([Xe(`dk-form`)],Z);var Q={warm:`var(--dk-accent)`,cool:`var(--dk-c6)`,you:`var(--dk-c1)`,them:`var(--dk-c2)`,ok:`var(--dk-ok)`,err:`var(--dk-err)`},$=class extends B{constructor(...e){super(...e),this.panel={type:`wordcloud`},this.view=`cloud`,this.fkey=null}createRenderRoot(){return this}facets(){return(this.panel.facets??[]).filter(e=>e.terms&&e.terms.length)}current(){let e=this.facets();return e.find(e=>e.key===this.fkey)??e[0]}body(){let e=this.current();if(!e?.terms?.length)return A`<div class="dk-muted">no terms for this lens</div>`;let t=e.legend&&e.legend.length?A`<div class="dk-legend">
            ${e.legend.map(e=>A`<span><i style="background:${Q[e.tone??``]??W(0)}"></i>${e.label}</span>`)}
          </div>`:``,n=[...e.terms].sort((e,t)=>(Number(t.weight)||0)-(Number(e.weight)||0));if(this.view===`bars`){let e=n.slice(0,22);return A`${t}${Je(e.map(e=>e.text),e.map(e=>Number(e.weight)||0))}`}let r=n.map(e=>Number(e.weight)||0),i=Math.max(...r,1),a=Math.min(...r,0),o=i-a||1;return A`${t}<div class="dk-cloud">
      ${n.slice(0,70).map((e,t)=>A`<span style="font-size:${12+Math.round(24*Math.sqrt(((Number(e.weight)||0)-a)/o))}px;color:${e.tone&&Q[e.tone]?Q[e.tone]:W(e.group==null?t:e.group)}" title=${String(e.weight??``)}>${e.text}</span>`)}
    </div>`}controls(){let e=this.facets(),t=this.current();return A`<div class="dk-wc-ctl">${e.length>1?A`<span class="dk-tg">
            ${e.map(e=>A`<button
                class="dk-tg-b ${e.key===t?.key?`on`:``}"
                @click=${()=>{this.fkey=e.key}}
              >
                ${e.label??e.key}
              </button>`)}
          </span>`:``}${A`<span class="dk-tg">
      ${[`cloud`,`bars`].map(e=>A`<button
          class="dk-tg-b ${e===this.view?`on`:``}"
          @click=${()=>{this.view=e}}
        >
          ${e}
        </button>`)}
    </span>`}</div>`}render(){let e=this.panel,t=this.facets().length>0;return A`<div class="dk-panel dk-full">
      ${e.title?A`<div class="dk-l">${e.title}</div>`:``}${t?this.controls():``}
      <div class="dk-wc-body">${t?this.body():A`<div class="dk-muted">no terms available</div>`}</div>
    </div>`}};Y([q({attribute:!1})],$.prototype,`panel`,void 0),Y([J()],$.prototype,`view`,void 0),Y([J()],$.prototype,`fkey`,void 0),$=Y([Xe(`dk-wordcloud`)],$);var yt=e=>A`<div class="dk-panel dk-full dk-sec">${e.title??``}</div>`,bt=e=>A`
  <div class="dk-panel dk-stat">
    <div class="dk-l">${e.label??``}</div>
    <div class="dk-n">${G(e.value)}${e.sub==null?``:A` <small>${e.sub}</small>`}</div>
    ${e.spark&&e.spark.length?We(e.spark,W(e.color??0)):``}
  </div>`,xt=e=>{let t=Number(e.max)||0,n=Number(e.value)||0,r=e.pct==null?t?100*n/t:0:Number(e.pct),i=e.text==null?t?`${G(n)} / ${G(t)} · ${r.toFixed(1)}%`:G(n):e.text,a=`${Math.max(0,Math.min(100,r)).toFixed(1)}%`;return A`
    <div class="dk-panel dk-full">
      <div class="dk-l">${e.label??``}</div>
      <div class="dk-bar"><i style="width:${a}"></i></div>
      <div class="dk-sub">${i}</div>
    </div>`},St=(e,t)=>e[t]===`right`||e[t]===`num`,Ct=e=>{let t=e.columns??[],n=e.rows??[],r=e.align??[];return A`
    <div class="dk-panel dk-full">
      ${e.title?A`<div class="dk-l">${e.title}</div>`:``}
      <table class="dk-tbl">
        <thead>
          <tr>
            ${t.map((e,t)=>A`<th class=${St(r,t)?`num`:``}>${e}</th>`)}
          </tr>
        </thead>
        <tbody>
          ${n.map(e=>A`<tr>
              ${e.map((e,t)=>A`<td class=${St(r,t)?`num`:``}>
                    ${typeof e==`number`?G(e):e}
                  </td>`)}
            </tr>`)}
        </tbody>
      </table>
    </div>`},wt=e=>A`
  <div class="dk-panel">
    ${e.title?A`<div class="dk-l" style="margin-bottom:6px">${e.title}</div>`:``}
    <div class="dk-kv">
      ${(e.items??[]).map(e=>A`<div class="r">
            <b>${e.k}</b><span>${typeof e.v==`number`?G(e.v):e.v}</span>
          </div>`)}
    </div>
  </div>`,Tt=e=>{let t=e.text==null?(e.lines??[]).join(`
`):e.text;return A`
    <div class="dk-panel dk-full">
      ${e.title?A`<div class="dk-l">${e.title}</div>`:``}
      <pre class="dk-log">${t}</pre>
    </div>`},Et=e=>A`<div class="dk-panel"><span class="dk-pill ${e.tone??``}">${e.text??``}</span></div>`,Dt=e=>{let t=String(e.text??``).split(/\n\s*\n/).filter(e=>e.trim());return A`
    <div class="dk-panel dk-full dk-prose">
      ${e.title?A`<div class="dk-l">${e.title}</div>`:``}${t.map(e=>A`<p>${e.trim()}</p>`)}
    </div>`},Ot=e=>A`<div class="dk-panel dk-full">${Be(e.html??``)}</div>`,kt=(e,t)=>A`
  <div class="dk-panel dk-full">
    ${e.title?A`<div class="dk-l">${e.title}</div>`:``}
    <div class="dk-acts">
      ${(e.buttons??[]).map(e=>A`<button
          class="dk-btn ${e.tone??``}"
          @click=${()=>t?.(e.action??``,e.payload??{})}
        >
          ${e.label??e.action??`action`}
        </button>`)}
    </div>
  </div>`;function At(e,t){try{switch(e.type){case`section`:return yt(e);case`stat`:return bt(e);case`progress`:return xt(e);case`chart`:return Ye(e);case`table`:return Ct(e);case`kv`:return wt(e);case`log`:return Tt(e);case`badge`:return Et(e);case`prose`:return Dt(e);case`html`:return Ot(e);case`actions`:return kt(e,t);case`button`:{let n=e;return kt({type:`actions`,title:n.title,buttons:[{label:n.label,action:n.action,payload:n.payload,tone:n.tone}]},t)}case`form`:return A`<dk-form .panel=${e} .onAction=${t}></dk-form>`;case`wordcloud`:return A`<dk-wordcloud .panel=${e}></dk-wordcloud>`;case`dag`:return A`<dk-dag .panel=${e} .onAction=${t}></dk-dag>`;default:return A`<div class="dk-panel dk-full">
          <span class="dk-muted">unknown atom: ${e.type}</span>
        </div>`}}catch(t){let n=t instanceof Error?t.message:String(t);return A`<div class="dk-panel dk-full dk-err">atom error (${e.type}): ${n}</div>`}}var jt=`
/* Two colour roles, kept apart on purpose. SEMANTIC tokens (accent/ok/warn/err/muted/ready)
   mean something: a status, a verdict. CATEGORICAL tokens (c1..c6) only separate one series
   from the next and carry no meaning. They used to be the same literals -- c1 was accent,
   c2 was ok, c3 was warn, c5 was err -- so a chart series was painted in the exact hex that
   means "blocked", and a status surface could pull a colour from the chart ramp. Semantic
   values are unchanged here; only the ramp and accent2 move. */
.dk-root{--dk-bg:#16140f;--dk-panel:#1f1b15;--dk-fg:#ece6d8;--dk-muted:#9a9384;--dk-line:#352f25;--dk-edge:#776d5c;
  --dk-accent:#d98a4f;--dk-accent2:#e8a765;--dk-ok:#6fa8a0;--dk-warn:#cda94e;--dk-err:#d4707a;--dk-ready:#7f9bd1;--dk-crit:#e35d44;
  --dk-c1:#8fbf7e;--dk-c2:#c495d8;--dk-c3:#d59bb4;--dk-c4:#6e8390;--dk-c5:#c9a97e;--dk-c6:#5fb9b2;
  color:var(--dk-fg);background:var(--dk-bg);font:14px/1.5 -apple-system,Segoe UI,Roboto,sans-serif;
  box-sizing:border-box;padding:18px 20px;display:block;min-height:100%}
.dk-root *{box-sizing:border-box}
html[data-theme=light] .dk-root,.dk-root[data-theme=light]{--dk-bg:#faf8f3;--dk-panel:#fff;--dk-fg:#1c1b19;
  --dk-muted:#7a756c;--dk-line:#e7e2d8;--dk-edge:#8b8478;--dk-accent:#b4541f;--dk-accent2:#c9762c;--dk-ok:#3f807a;
  --dk-warn:#9a7a18;--dk-err:#b1414f;--dk-ready:#41639b;--dk-crit:#b83227;--dk-c1:#4a7a3a;--dk-c2:#7a5bb0;--dk-c3:#a0507e;
  --dk-c4:#4a6670;--dk-c5:#8a6134;--dk-c6:#2f7f88}
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
.dk-dag-elig-key{background:transparent!important;border:2px solid var(--dk-ready);border-radius:3px}
.dk-dag-crit-key{background:var(--dk-crit)!important}
.dk-dag-float-key{background:var(--dk-edge)!important;opacity:.4}
/* graph + inspector sit side by side, and wrap the inspector under the graph when the panel
   is too narrow to hold both. */
.dk-dag-body{display:flex;flex-wrap:wrap;gap:10px;margin-top:6px;align-items:flex-start}
.dk-dag-scroll{flex:1 1 440px;min-width:0;border:1px solid var(--dk-line);border-radius:9px;background:var(--dk-bg);overflow:auto;max-height:640px}
svg.dk-dag{display:block}
/* Float rail: how far a unit can slip before it moves the finish. Behind the nodes, quiet. */
.dk-dag-float{fill:var(--dk-edge);opacity:.28}
.dk-dag-float.dim{opacity:.08}
/* --dk-edge, not --dk-line: a dependency arrow is a graphical object carrying meaning and
   needs >=3:1 against the scroll box's --dk-bg, while --dk-line is a hairline border that
   should stay quiet. Sharing one token put every edge at ~1.4:1 dark / ~1.2:1 light. */
.dk-dag-edge{fill:none;stroke:var(--dk-edge);stroke-width:1.5}
.dk-dag-edge.back{stroke-dasharray:4 3}
/* The critical path (zero float): the chain that sets the finish. Drawn in the semantic
   critical colour, above the ordinary edges, so the spine of the plan reads at a glance. */
.dk-dag-edge.crit{stroke:var(--dk-crit);stroke-width:2.25}
.dk-dag-edge.on{stroke:var(--dk-accent);stroke-width:2}
.dk-dag-arrowhead{fill:var(--dk-edge)}
.dk-dag-node.crit .dk-dag-box{stroke:var(--dk-crit)}
.dk-dag-node{transition:opacity .15s ease}
.dk-dag-node.act{cursor:pointer}
.dk-dag-node.dim{opacity:.3}
.dk-dag-box{fill:var(--dk-panel);stroke:var(--dk-line);stroke-width:1}
.dk-dag-box.elig{stroke:var(--dk-ready);stroke-width:2}
.dk-dag-node:hover .dk-dag-box{stroke:var(--dk-accent)}
/* Hover must not eat the ready ring. The plain hover rule above is (0,3,0) and outranked the
   (0,2,0) .elig rule, so hovering a startable node to see what it depends on repainted its
   "ready now" ring as a generic hover ring -- the one signal you were reading vanished at the
   moment you reached for it. This (0,4,0) rule restores it while still marking hover. */
.dk-dag-node:hover .dk-dag-box.elig{stroke:var(--dk-ready);stroke-width:2.5}
.dk-dag-lbl{fill:var(--dk-fg);font-size:12px;font-weight:600}
.dk-dag-sub{fill:var(--dk-muted);font-size:11px;font-family:ui-monospace,monospace}
/* selected node: its own outline, set after the hover/crit rules so a click reads clearly.
   Hover (higher specificity) still wins while the pointer is on it, as transient feedback. */
.dk-dag-node.sel .dk-dag-box{stroke:var(--dk-accent2);stroke-width:3}
/* --- inspector --- */
.dk-dag-insp{flex:0 1 320px;min-width:240px;border:1px solid var(--dk-line);border-radius:9px;background:var(--dk-panel);padding:12px 14px;max-height:640px;overflow:auto;display:flex;flex-direction:column;gap:10px}
.dk-dag-insp.empty{align-items:center;justify-content:center;color:var(--dk-muted)}
.dk-dag-insp-hint{font-size:12px;color:var(--dk-muted);text-align:center;padding:18px 8px}
.dk-dag-insp-head{display:flex;align-items:center;justify-content:space-between;gap:8px}
.dk-dag-insp-id{font-family:ui-monospace,monospace;font-size:12px;letter-spacing:.08em;color:var(--dk-muted);text-transform:uppercase}
.dk-dag-insp-x{border:0;background:none;color:var(--dk-muted);font-size:18px;line-height:1;cursor:pointer;padding:0 2px}
.dk-dag-insp-x:hover{color:var(--dk-fg)}
.dk-dag-insp-title{font-size:15px;font-weight:600;line-height:1.25}
.dk-dag-insp-chips{display:flex;flex-wrap:wrap;gap:6px}
.dk-dag-state{font-size:11px;padding:2px 9px;border-radius:20px;border:1px solid var(--dk-line);text-transform:lowercase}
.dk-dag-facts{display:grid;grid-template-columns:auto 1fr;gap:3px 12px;margin:0;font-size:12px}
.dk-dag-facts>div{display:contents}
.dk-dag-facts dt{color:var(--dk-muted);text-transform:uppercase;font-size:10px;letter-spacing:.05em;align-self:center}
.dk-dag-facts dd{margin:0;color:var(--dk-fg)}
.dk-dag-insp-note{font-size:12.5px;line-height:1.55;color:var(--dk-fg);margin:0}
.dk-dag-insp-sec{display:flex;flex-direction:column;gap:5px;padding-top:9px;border-top:1px solid var(--dk-line)}
.dk-dag-ref{font-size:12px}
.dk-dag-ref a{color:var(--dk-accent);text-decoration:none}
.dk-dag-ref a:hover{text-decoration:underline}
.dk-dag-ref-l{color:var(--dk-fg);font-weight:600}
.dk-dag-ref-t{color:var(--dk-muted);line-height:1.5;margin-top:2px}
.dk-dag-chips{display:flex;flex-wrap:wrap;gap:5px}
.dk-dag-chip{font-family:ui-monospace,monospace;font-size:11px;padding:2px 8px;border:1px solid var(--dk-line);border-radius:5px;background:var(--dk-bg);color:var(--dk-fg);cursor:pointer}
.dk-dag-chip:hover{border-color:var(--dk-accent);color:var(--dk-accent)}
.dk-dag-insp .dk-l{font-size:10px;color:var(--dk-muted);text-transform:uppercase;letter-spacing:.06em}`;function Mt(){if(typeof document>`u`||document.getElementById(`dk-css`))return;let e=document.createElement(`style`);e.id=`dk-css`,e.textContent=jt,(document.head??document.documentElement).appendChild(e)}var Nt=`1`,Pt=`\0`,Ft=(e,t,n)=>typeof t.id==`string`?`${e}${Pt}id:${t.id}`:`${e}${Pt}ix:${n}`;function It(e,t,n,r=``){Mt(),t.classList.add(`dk-root`);let i=e.panels??[];z(A`
      ${e.title?A`<div class="dk-title">${e.title}</div>`:``}
      <div class="dk-panels">
        ${Re(i,(e,t)=>Ft(r,e,t),e=>At(e,n))}
      </div>
    `,t)}var Lt=250,Rt=3e3;function zt(e,t){let n=Number(e?.refresh_ms);if(Number.isFinite(n)&&n>0)return Math.max(Lt,n);let r=Number(t);return Number.isFinite(r)&&r>0?Math.max(Lt,r):Rt}function Bt(e){let t=(typeof e.mount==`string`?document.querySelector(e.mount):e.mount)??document.body,{actionUrl:n}=e,r=e.onAction??(n?(e,t)=>{fetch(n,{method:`POST`,headers:{"Content-Type":`application/json`},body:JSON.stringify({action:e,payload:t})}).catch(()=>{})}:void 0),i=!1,a,o=null;z(N,t);let s=async()=>{if(!i){try{let n=await(await fetch(e.renderUrl,{cache:`no-store`})).json();if(i)return;o=n,It(n,t,r,e.renderUrl)}catch{}a=setTimeout(()=>void s(),zt(o,e.refreshMs))}};return s(),{stop:()=>{i=!0,a&&clearTimeout(a),z(N,t)}}}return e.mount=Bt,e.refreshDelay=zt,e.renderSpec=It,e.version=Nt,e})({});