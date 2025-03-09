const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("ProductFactory", function () {
  let productFactory;
  let owner;
  let addr1;

  beforeEach(async function () {
    [owner, addr1] = await ethers.getSigners();

    const ProductFactory = await ethers.getContractFactory("ProductFactory");
    productFactory = await ProductFactory.deploy();
    await productFactory.waitForDeployment();
  });

  describe("Product Creation", function () {
    it("Should create a new product", async function () {
      const tx = await productFactory.createProduct();
      const receipt = await tx.wait();

      // Get the ProductCreated event
      const event = receipt.logs.find(
        (log) => log.fragment.name === "ProductCreated"
      );
      expect(event).to.not.be.undefined;

      // Check product count
      expect(await productFactory.getProductCount()).to.equal(1);

      // Check if product is valid
      const productAddress = await productFactory.products(0);
      expect(await productFactory.isValidProduct(productAddress)).to.be.true;
    });

    it("Should only allow owner to create products", async function () {
      await expect(
        productFactory.connect(addr1).createProduct()
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });

    it("Should return all products", async function () {
      // Create multiple products
      await productFactory.createProduct();
      await productFactory.createProduct();

      const products = await productFactory.getAllProducts();
      expect(products.length).to.equal(2);

      // Verify each product is valid
      for (const product of products) {
        expect(await productFactory.isValidProduct(product)).to.be.true;
      }
    });
  });
});
