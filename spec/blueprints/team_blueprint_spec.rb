# frozen_string_literal: true

require "rails_helper"
require "./spec/support/shared_examples/blueprints/blueprint"

RSpec.describe TeamBlueprint do
  describe "#render" do
    let(:record) { create(:team) }

    it_behaves_like "a blueprint" do
      let(:expected_keys) { %i[id name] }
    end
  end
end
