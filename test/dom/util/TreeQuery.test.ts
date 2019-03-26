import $$ from '../../TestHelpers'
import { TreeQuery } from '../../../src/dom/util/TreeQuery'

describe('TreeQuery', function () {

  test('getDescendantNodes()', function () {
    const doctype = $$.dom.createDocumentType('name', 'pubId', 'sysId')
    const doc = $$.dom.createDocument('my ns', 'root', doctype)
    if (!doc.documentElement)
      throw new Error("documentElement is null")
    const de = doc.documentElement
    const elewithshadow = doc.createElementNS('http://www.w3.org/1999/xhtml', 'my-custom-element')
    const ele = [ doc.createElement('ele'),
      doc.createTextNode('text'),
      elewithshadow,
      doc.createComment('comment')]
    de.append(...ele)
    const shadowRoot = elewithshadow.attachShadow({ mode: 'open'})
    shadowRoot.appendChild(doc.createElement('sh1'))
    shadowRoot.appendChild(doc.createTextNode('shtext'))
    shadowRoot.appendChild(doc.createElement('sh2'))

    let str = ''
    for (const childNode of TreeQuery.getDescendantNodes(doc, true, true, (node) => { return (node.nodeType == 3) })) {
        str += childNode.nodeValue + ' '
    }
    expect(str).toBe('text shtext ')
  })

  test('getDescendantElements()', function () {
    const doctype = $$.dom.createDocumentType('name', 'pubId', 'sysId')
    const doc = $$.dom.createDocument('my ns', 'root', doctype)
    if (!doc.documentElement)
      throw new Error("documentElement is null")
    const de = doc.documentElement
    const elewithshadow = doc.createElementNS('http://www.w3.org/1999/xhtml', 'my-custom-element')
    const ele = [ doc.createElement('sele'),
      doc.createTextNode('text'),
      elewithshadow,
      doc.createComment('comment')]
    de.append(...ele)
    const shadowRoot = elewithshadow.attachShadow({ mode: 'open'})
    shadowRoot.appendChild(doc.createElement('sh1'))
    shadowRoot.appendChild(doc.createTextNode('shtext'))
    shadowRoot.appendChild(doc.createElement('sh2'))

    let str = ''
    for (const childNode of TreeQuery.getDescendantElements(doc, true, true, (node) => { return node.nodeName.startsWith('s') })) {
        str += childNode.nodeName + ' '
    }
    expect(str).toBe('sele sh1 sh2 ')
  })

  test('getSiblingNodes()', function () {
    const doctype = $$.dom.createDocumentType('name', 'pubId', 'sysId')
    const doc = $$.dom.createDocument('my ns', 'root', doctype)
    if (!doc.documentElement)
      throw new Error("documentElement is null")
    const de = doc.documentElement
    const txt1 = doc.createTextNode('text1')
    const txt2 = doc.createTextNode('text2')
    const ele = [ doc.createElement('ele'),
      txt1,
      doc.createComment('comment'),
      txt2]
    de.append(...ele)

    let str = ''
    for (const childNode of TreeQuery.getSiblingNodes(txt1, true, (node) => { return (node.nodeType == 3) })) {
      str += childNode.nodeValue + ' '
    }
    expect(str).toBe('text1 text2 ')
    str = ''
    for (const childNode of TreeQuery.getSiblingNodes(txt1, false, (node) => { return (node.nodeType == 3) })) {
      str += childNode.nodeValue + ' '
    }
    expect(str).toBe('text2 ')
    let count = 0
    for (const _ of TreeQuery.getSiblingNodes(txt1)) {
      count++
    }
    expect(count).toBe(3)
  })

  test('isConstrained()', function () {
    const doctype = $$.dom.createDocumentType('name', 'pub', 'sys')
    const doc = $$.dom.createDocument('ns', '')
    
    doc.appendChild(doc.createComment('comment'))
    doc.appendChild(doc.createProcessingInstruction('target', 'data'))
    doc.appendChild(doctype)
    doc.appendChild(doc.createComment('comment'))
    doc.appendChild(doc.createProcessingInstruction('target', 'data'))
    doc.appendChild(doc.createElement('root'))
    doc.appendChild(doc.createComment('comment'))
    doc.appendChild(doc.createProcessingInstruction('target', 'data'))
    
    if (!doc.documentElement)
      throw new Error("documentElement is null")
    const de = doc.documentElement
    const ele = doc.createElement('ele')
    de.append(
      doc.createComment('comment'),
      doc.createProcessingInstruction('target', 'data'),
      doc.createCDATASection('cdata'),
      doc.createTextNode('text'),
      ele,
      doc.createComment('comment'),
      doc.createProcessingInstruction('target', 'data'),      
      doc.createCDATASection('cdata'),
      doc.createTextNode('text')
    )
    ele.append(
      doc.createComment('comment'),
      doc.createProcessingInstruction('target', 'data'),
      doc.createCDATASection('cdata'),
      doc.createTextNode('text'),
      doc.createComment('comment'),
      doc.createProcessingInstruction('target', 'data'),      
      doc.createCDATASection('cdata'),
      doc.createTextNode('text')
    )    

    expect(TreeQuery.isConstrained(doc)).toBeTruthy()
  })

  test('isConstrained() invalid documents', function () {
    {
      // two doctypes
      const doctype1 = $$.dom.createDocumentType('root', 'pub', 'sys');
      const doctype2 = $$.dom.createDocumentType('root', 'pub', 'sys');
      const doc = $$.dom.createDocument('ns', '');
      (<any>doctype1)._parentNode = doc;
      (<any>doctype2)._parentNode = doc;
      (<any>doc)._firstChild = doctype1;
      (<any>doctype1)._nextSibling = doctype2;
      (<any>doc)._lastChild = doctype2;
      expect(TreeQuery.isConstrained(doc)).toBeFalsy()
    }
    {
      // doctype after element
      const doctype = $$.dom.createDocumentType('root', 'pub', 'sys');
      const doc = $$.dom.createDocument('ns', '');
      const ele = doc.createElement('root');
      (<any>doctype)._parentNode = doc;
      (<any>ele)._parentNode = doc;
      (<any>doc)._firstChild = ele;
      (<any>ele)._nextSibling = doctype;
      (<any>doc)._lastChild = doctype;
      expect(TreeQuery.isConstrained(doc)).toBeFalsy()
    }
    {
      // two document elements
      const doc = $$.dom.createDocument('ns', '');
      const ele1 = doc.createElement('root');
      const ele2 = doc.createElement('root');
      (<any>ele1)._parentNode = doc;
      (<any>ele2)._parentNode = doc;
      (<any>doc)._firstChild = ele1;
      (<any>ele1)._nextSibling = ele2;
      (<any>doc)._lastChild = ele2;
      expect(TreeQuery.isConstrained(doc)).toBeFalsy()
    }
    {
      // text at root level
      const doc = $$.dom.createDocument('ns', '');
      const node = doc.createTextNode('root');
      (<any>node)._parentNode = doc;
      (<any>doc)._firstChild = node;
      (<any>doc)._lastChild = node;
      expect(TreeQuery.isConstrained(doc)).toBeFalsy()
    }
    {
      // CDATA at root level
      const doc = $$.dom.createDocument('ns', '');
      const node = doc.createCDATASection('root');
      (<any>node)._parentNode = doc;
      (<any>doc)._firstChild = node;
      (<any>doc)._lastChild = node;
      expect(TreeQuery.isConstrained(doc)).toBeFalsy()
    }
    {
      // CDATA at root level
      const doc = $$.dom.createDocument('ns', '');
      const node = doc.createCDATASection('root');
      (<any>node)._parentNode = doc;
      (<any>doc)._firstChild = node;
      (<any>doc)._lastChild = node;
      expect(TreeQuery.isConstrained(doc)).toBeFalsy()
    }
    {
      // doctype in fragment
      const doctype = $$.dom.createDocumentType('root', 'pub', 'sys');
      const doc = $$.dom.createDocument('ns', '');
      const ele = doc.createDocumentFragment();
      (<any>doctype)._parentNode = ele;
      (<any>ele)._firstChild = doctype;
      (<any>ele)._lastChild = doctype;
      expect(TreeQuery.isConstrained(ele)).toBeFalsy()
    }
    {
      // error in nested elements
      const doctype = $$.dom.createDocumentType('root', 'pub', 'sys');
      const doc = $$.dom.createDocument('ns', '');
      const de = doc.createElement('root');
      const ele = doc.createElement('root');
      doc.appendChild(de);
      de.appendChild(ele);
      (<any>doctype)._parentNode = ele;
      (<any>ele)._firstChild = doctype;
      (<any>ele)._lastChild = doctype;
      expect(TreeQuery.isConstrained(doc)).toBeFalsy()
    }
  })

  test('nodeLength()', function () {
    const doctype = $$.dom.createDocumentType('name', 'pubId', 'sysId')
    const doc = $$.dom.createDocument('my ns', 'root', doctype)
    if (!doc.documentElement)
      throw new Error("documentElement is null")
    const de = doc.documentElement
    const ele = [ doc.createElement('sele'),
      doc.createTextNode('text'),
      doc.createComment('comment')]
    de.append(...ele)

    expect(TreeQuery.nodeLength(doctype)).toBe(0)
    expect(TreeQuery.nodeLength(de)).toBe(3)
    expect(TreeQuery.nodeLength(ele[1])).toBe(4)
  })

  test('isEmpty()', function () {
    const doctype = $$.dom.createDocumentType('name', 'pubId', 'sysId')
    const doc = $$.dom.createDocument('my ns', 'root', doctype)
    if (!doc.documentElement)
      throw new Error("documentElement is null")
    const de = doc.documentElement
    const ele = [ doc.createElement('sele'),
      doc.createTextNode('text'),
      doc.createComment('comment')]
    de.append(...ele)

    expect(TreeQuery.isEmpty(doctype)).toBeTruthy()
    expect(TreeQuery.isEmpty(de)).toBeFalsy()
    expect(TreeQuery.isEmpty(ele[1])).toBeFalsy()
  })

  test('rootNode()', function () {
    const doctype = $$.dom.createDocumentType('name', 'pubId', 'sysId')
    const doc = $$.dom.createDocument('my ns', 'root', doctype)
    if (!doc.documentElement)
      throw new Error("documentElement is null")
    const de = doc.documentElement
    const ele = [ doc.createElement('sele'),
      doc.createTextNode('text'),
      doc.createComment('comment')]
    de.append(...ele)

    expect(TreeQuery.rootNode(de)).toBe(doc)
  })

  test('isDescendantOf()', function () {
    const doctype = $$.dom.createDocumentType('name', 'pubId', 'sysId')
    const doc = $$.dom.createDocument('my ns', 'root', doctype)
    if (!doc.documentElement)
      throw new Error("documentElement is null")
    const de = doc.documentElement
    const elewithshadow = doc.createElementNS('http://www.w3.org/1999/xhtml', 'my-custom-element')
    const ele = [ doc.createElement('ele'),
      doc.createTextNode('text'),
      elewithshadow,
      doc.createComment('comment')]
    de.append(...ele)
    const shadowRoot = elewithshadow.attachShadow({ mode: 'open'})
    const shtext = doc.createTextNode('shtext')
    shadowRoot.appendChild(doc.createElement('sh1'))
    shadowRoot.appendChild(shtext)
    shadowRoot.appendChild(doc.createElement('sh2'))

    expect(TreeQuery.isDescendantOf(de, de)).toBeFalsy()
    expect(TreeQuery.isDescendantOf(de, de, true)).toBeTruthy()
    expect(TreeQuery.isDescendantOf(de, ele[0])).toBeTruthy()
    expect(TreeQuery.isDescendantOf(de, shtext)).toBeFalsy()
    expect(TreeQuery.isDescendantOf(de, shtext, false, true)).toBeTruthy()
  })

  test('isAncestorOf()', function () {
    const doctype = $$.dom.createDocumentType('name', 'pubId', 'sysId')
    const doc = $$.dom.createDocument('my ns', 'root', doctype)
    if (!doc.documentElement)
      throw new Error("documentElement is null")
    const de = doc.documentElement
    const elewithshadow = doc.createElementNS('http://www.w3.org/1999/xhtml', 'my-custom-element')
    const ele = [ doc.createElement('ele'),
      doc.createTextNode('text'),
      elewithshadow,
      doc.createComment('comment')]
    de.append(...ele)
    const shadowRoot = elewithshadow.attachShadow({ mode: 'open'})
    const shtext = doc.createTextNode('shtext')
    shadowRoot.appendChild(doc.createElement('sh1'))
    shadowRoot.appendChild(shtext)
    shadowRoot.appendChild(doc.createElement('sh2'))

    expect(TreeQuery.isAncestorOf(de, de)).toBeFalsy()
    expect(TreeQuery.isAncestorOf(de, de, true)).toBeTruthy()
    expect(TreeQuery.isAncestorOf(ele[0], de)).toBeTruthy()
    expect(TreeQuery.isAncestorOf(shtext, de)).toBeFalsy()
    expect(TreeQuery.isAncestorOf(shtext, de, false, true)).toBeTruthy()
  })

  test('isSiblingOf()', function () {
    const doctype = $$.dom.createDocumentType('name', 'pubId', 'sysId')
    const doc = $$.dom.createDocument('my ns', 'root', doctype)
    if (!doc.documentElement)
      throw new Error("documentElement is null")
    const de = doc.documentElement
    const elewithshadow = doc.createElementNS('http://www.w3.org/1999/xhtml', 'my-custom-element')
    const ele = [ doc.createElement('ele'),
      doc.createTextNode('text'),
      elewithshadow,
      doc.createComment('comment')]
    de.append(...ele)
    const shadowRoot = elewithshadow.attachShadow({ mode: 'open'})
    const shele = doc.createElement('sh1')
    const shtext = doc.createTextNode('shtext')
    shadowRoot.appendChild(shele)
    shadowRoot.appendChild(shtext)
    shadowRoot.appendChild(doc.createElement('sh2'))

    expect(TreeQuery.isSiblingOf(de, de)).toBeFalsy()
    expect(TreeQuery.isSiblingOf(de, de, true)).toBeTruthy()
    expect(TreeQuery.isSiblingOf(ele[0], de)).toBeFalsy()
    expect(TreeQuery.isSiblingOf(ele[0], ele[1])).toBeTruthy()
    expect(TreeQuery.isSiblingOf(shtext, shele)).toBeTruthy()
  })

  test('isPreceding()', function () {
    const doctype = $$.dom.createDocumentType('name', 'pubId', 'sysId')
    const doc = $$.dom.createDocument('my ns', 'root', doctype)
    if (!doc.documentElement)
      throw new Error("documentElement is null")
    const de = doc.documentElement
    const elewithshadow = doc.createElementNS('http://www.w3.org/1999/xhtml', 'my-custom-element')
    const ele = [ doc.createElement('ele'),
      doc.createTextNode('text'),
      elewithshadow,
      doc.createComment('comment')]
    de.append(...ele)

    expect(TreeQuery.isPreceding(de, de)).toBeFalsy()
    expect(TreeQuery.isPreceding(ele[0], de)).toBeTruthy()
    expect(TreeQuery.isPreceding(de, ele[0])).toBeFalsy()
    expect(TreeQuery.isPreceding(ele[1], ele[0])).toBeTruthy()
    // free node
    const freeEle = new $$.Element(null, 'free', '')
    expect(TreeQuery.isPreceding(de, freeEle)).toBeFalsy()
    // from another doc
    const doc2 = $$.dom.createDocument('my ns', 'root2')
    if (!doc2.documentElement)
      throw new Error("documentElement is null")
    const de2 = doc2.documentElement
    expect(TreeQuery.isPreceding(de, de2)).toBeFalsy()
  })

  test('isFollowing()', function () {
    const doctype = $$.dom.createDocumentType('name', 'pubId', 'sysId')
    const doc = $$.dom.createDocument('my ns', 'root', doctype)
    if (!doc.documentElement)
      throw new Error("documentElement is null")
    const de = doc.documentElement
    const elewithshadow = doc.createElementNS('http://www.w3.org/1999/xhtml', 'my-custom-element')
    const ele = [ doc.createElement('ele'),
      doc.createTextNode('text'),
      elewithshadow,
      doc.createComment('comment')]
    de.append(...ele)

    expect(TreeQuery.isFollowing(de, de)).toBeFalsy()
    expect(TreeQuery.isFollowing(ele[0], de)).toBeFalsy()
    expect(TreeQuery.isFollowing(de, ele[0])).toBeTruthy()
    expect(TreeQuery.isFollowing(ele[0], ele[1])).toBeTruthy()
    // free node
    const freeEle = new $$.Element(null, 'free', '')
    expect(TreeQuery.isFollowing(de, freeEle)).toBeFalsy()
    // from another doc
    const doc2 = $$.dom.createDocument('my ns', 'root2')
    if (!doc2.documentElement)
      throw new Error("documentElement is null")
    const de2 = doc2.documentElement
    expect(TreeQuery.isFollowing(de, de2)).toBeFalsy()
  })

  test('firstChild()', function () {
    const doctype = $$.dom.createDocumentType('name', 'pubId', 'sysId')
    const doc = $$.dom.createDocument('my ns', 'root', doctype)
    if (!doc.documentElement)
      throw new Error("documentElement is null")
    const de = doc.documentElement
    const elewithshadow = doc.createElementNS('http://www.w3.org/1999/xhtml', 'my-custom-element')
    const ele = [ doc.createElement('ele'),
      doc.createTextNode('text'),
      elewithshadow,
      doc.createComment('comment')]
    de.append(...ele)
    const shadowRoot = elewithshadow.attachShadow({ mode: 'open'})
    const shele = doc.createElement('sh1')
    const shtext = doc.createTextNode('shtext')
    shadowRoot.appendChild(shele)
    shadowRoot.appendChild(shtext)
    shadowRoot.appendChild(doc.createElement('sh2'))

    expect(TreeQuery.firstChild(de)).toBe(ele[0])
    expect(TreeQuery.firstChild(shadowRoot)).toBe(shele)
  })

  test('lastChild()', function () {
    const doctype = $$.dom.createDocumentType('name', 'pubId', 'sysId')
    const doc = $$.dom.createDocument('my ns', 'root', doctype)
    if (!doc.documentElement)
      throw new Error("documentElement is null")
    const de = doc.documentElement
    const elewithshadow = doc.createElementNS('http://www.w3.org/1999/xhtml', 'my-custom-element')
    const ele = [ doc.createElement('ele'),
      doc.createTextNode('text'),
      elewithshadow,
      doc.createComment('comment')]
    de.append(...ele)
    const shadowRoot = elewithshadow.attachShadow({ mode: 'open'})
    const shele = doc.createElement('sh1')
    const shtext = doc.createTextNode('shtext')
    shadowRoot.appendChild(shele)
    shadowRoot.appendChild(shtext)

    expect(TreeQuery.lastChild(de)).toBe(ele[3])
    expect(TreeQuery.lastChild(shadowRoot)).toBe(shtext)
  })

})