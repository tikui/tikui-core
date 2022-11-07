const getIframe = <K extends keyof HTMLElementTagNameMap, S>(selector: K) =>
  cy
    .get(selector)
    .its('0.contentDocument.body').should('not.be.empty')
    .then(cy.wrap)

describe('Tikui', () => {
  beforeEach(() => cy.visit('http://localhost:3005'));


  it('Should have documentation style', () => {
    cy.get('link').should('have.attr', 'href', 'documentation/style.css');
  });

  describe('Component', () => {
    it('Should be shown', () => {
      getIframe('iframe').find('.tikui-core-component').should('have.text', 'Component');
      cy.contains('<div class="tikui-core-component">Component</div>');
      cy.contains(".tikui-core-component Component");
    });
  });
})
