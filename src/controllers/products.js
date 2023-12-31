const knex = require('../../database/connection')
const { uploadImg, deleteImg } = require('../services/upload');

const registerProduct = async (req, res) => {
  const { descricao, quantidade_estoque, valor, categoria_id } = req.body

  if (!descricao || !quantidade_estoque || !valor || !categoria_id) {
    return res.status(400).json({
      mensagem:
        'Os campos: (descricao, quantidade_estoque,valor e categoria_id) são obrigatórios'
    })
  }

  try {
    const existingProduct = await knex('produtos').where({ descricao }).first()

    if (existingProduct) {
      return res.status(400).json({
        mensagem: 'Produto já cadastrado'
      })
    }
    const category = await knex('categorias')
      .where({
        id: categoria_id
      })
      .first()

    if (!category) {
      return res.status(400).json({
        mensagem: 'Categoria não encontrada'
      })
    }

    let product = await knex('produtos')
      .insert({
        descricao,
        quantidade_estoque,
        valor,
        categoria_id: category.id
      })
      .returning('*')

    if (req.file) {
      const { originalname, mimetype, buffer } = req.file
      const img = await uploadImg(`produtos/${product.id}/${originalname}`, buffer, mimetype)

      product = await knex('produtos').update({ produto_imagem: img.url }).where('id', product[0].id).returning('*')

      product[0].produto_imagem = img.url
      return res.status(201).json(product[0])
    }

    return res.status(201).json(product)

  } catch (error) {
    return res.status(500).json({
      mensagem: 'Erro interno no servidor'
    })
  }
}

const listProducts = async (req, res) => {
  const { categoria_id } = req.query
  try {

    if (categoria_id) {
      const existingCategories = await knex('categorias').where('id', categoria_id).first()
      if (existingCategories) {
        const categoriesProducts = await knex('produtos').where('categoria_id', categoria_id)
        if (categoriesProducts.length === 0) {
          return res.status(404).json({ mensagem: 'Não existe produto cadastrado para a categoria informada' })
        } else {
          return res.status(200).json(categoriesProducts)
        }
      } else {
        return res.status(404).json({ mensagem: 'Não existe categoria para o id informado.' })
      }
    }

    const products = await knex('produtos')
    return res.status(200).json(products)


  } catch (error) {
    console.log(error)
    return res.status(500).json({ mensagem: "Erro interno do servidor" })
  }
}

const updateproduct = async (req, res) => {
  const { id } = req.params
  const { descricao, quantidade_estoque, valor, categoria_id } = req.body

  if (!descricao || !quantidade_estoque || !valor || !categoria_id) {
    return res.status(404).json({ mensagem: "Informe ao menos um campo para atualizaçao do produto" })

  }

  try {
    const productId = await knex('produtos').where('id', id).first()

    if (!productId) {
      return res.status(404).json({ mensagem: 'Produto não encontrado' })
    }

    const category = await knex('categorias').where({ id: categoria_id }).first()

    if (!category) {
      return res.status(400).json({ mensagem: 'Categoria não encontrada' })
    }
    const update = await knex('produtos').where('id', id).update(req.body).returning('*')

    if (!update) {
      return res.status(400).json({ mensagem: 'O produto não foi atualizado' })
    }

    return res.status(200).json({ mensagem: 'produto foi atualizado com sucesso.' })

  } catch (error) {
    return res.status(400).json(error.message)
  }

}

const getProduct = async (req, res) => {
  const { id } = req.params

  try {
    const productId = await knex("produtos")
      .where("id", id)
      .first()
    if (productId) {
      return res.status(200).json(productId)
    } else {
      return res.status(404).json({ message: "Produto não encontrado!" })
    }
  } catch (error) {
    return res.status(500).json({ mensagem: "Erro interno do servidor" })
  }
}

const deleteProduct = async (req, res) => {
  const { id } = req.params

  try {
    const productId = await knex('produtos')
      .where('id', id)
      .first()

    if (!productId) {
      return res.status(404).json({ mensagem: 'Produto não encontrado' })
    }

    const productRequest = await knex('pedido_produtos').where('produto_id', id).first()
    if (productRequest) {
      return res.status(200).json({ mensagem: 'O produto não pode ser excluído, pois está vinculado a pedidos!' })
    }

    if (productId.produto_imagem) {
      await deleteImg(productId.produto_imagem)
    }

    const deleteProduct = await knex('produtos')
      .where('id', id)
      .del()

    if (!deleteProduct) {
      return res.status(400).json({ mensagem: 'O Produto não foi deletado' })
    }

    return res.status(200).json({ mensagem: 'Produto excluído com sucesso' })
  } catch (error) {
    console.log(error)
    return res.status(500).json({ mensagem: 'Erro interno do servidor' })
  }
}

module.exports = {
  registerProduct,
  deleteProduct,
  getProduct,
  updateproduct,
  listProducts
}
