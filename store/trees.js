import mockMapTree from '@/mocks/map_tree.json'
import Api from '~/assets/js/api'
import Helpers from '~/assets/js/helpers'

let addShift = (node, parents = []) => {
  node.props.pos.x += 1000
  node.props.pos.y += 1000
  if (node.children) {
    node.children.forEach(addShift)
  }
}

let addParents = (node, parents = []) => {
  node.parents = parents
  if (node.children) {
    let childParents = [node, ...parents]
    node.children.forEach(child => addParents(child, childParents))
  }
}

let calcBounds = (node) => {
  let boundsArr = {min:{x:[], y:[]}, max:{x:[], y:[]}}

  let calcBoundsNode = (node, depth = 1) => {
    let width = 120 / depth + 20
    boundsArr.min.x.push(node.props.pos.x - width / 2)
    boundsArr.min.y.push(node.props.pos.y - width / 2)
    boundsArr.max.x.push(node.props.pos.x + width / 2)
    boundsArr.max.y.push(node.props.pos.y + width / 2)

    if (node.children) {
      node.children.forEach(child => calcBoundsNode(child, depth + 1))
    }
  }

  calcBoundsNode(node)

  return {
    min: {
      x: Math.min(...boundsArr.min.x),
      y: Math.min(...boundsArr.min.y),
    },
    max: {
      x: Math.max(...boundsArr.max.x),
      y: Math.max(...boundsArr.max.y),
    },
  }
}

export default {
  namespaced: true,
  state() {
    return {
      globalTree: {},
      lastItem: {},
      bounds: {},
    }
  },
  getters: {
    flatBadges: state => {
      if (!state.globalTree.children) return []

      var flat = Object.values(Helpers.flatArray(state.globalTree))
      return flat
    },
  },
  mutations: {
    set(state, tree) {
      state.globalTree = tree
    },
    addShift(state) {
      addShift(state.globalTree)
    },
    addParents(state) {
      addParents(state.globalTree)
    },
    addLayout(state) {
      state.globalTree = Layout.addLayout(state.globalTree)
    },
    setBounds(state, bounds) {
      state.bounds = bounds
    },
    moveSubtree(state, {node, shift}) {
      let move = (node2, shift) => {
        node2.props.pos.x += shift.x
        node2.props.pos.y += shift.y

        if (node2.children)
          node2.children.forEach(child => move(child, shift))
      }
      move(node, shift)
    }
  },
  actions: {
    loadMock(context, tree = {}) {
      context.commit('set', tree || mockMapTree)
      context.commit('addShift')
      context.commit('addParents')
      context.dispatch('calcBounds')
    },
    loadFromApi(context, mapTree) {
      let treeFromApi = Helpers.addCoordinates(Helpers.convertTreeFromApi(mapTree), mockMapTree)
      context.dispatch('loadMock', treeFromApi)
    },
    calcBounds(context) {
      context.commit('setBounds', calcBounds(context.state.globalTree))
    },
    async moveSubtree(context, {node, shift}) {
      context.commit('moveSubtree', {node, shift})
    }
  },
}
