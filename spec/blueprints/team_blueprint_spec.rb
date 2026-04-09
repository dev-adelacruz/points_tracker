# frozen_string_literal: true

require "rails_helper"
require "./spec/support/shared_examples/blueprints/blueprint"

RSpec.describe TeamBlueprint do
  describe "#render" do
    let(:record) { create(:team) }

    it_behaves_like "a blueprint" do
      let(:expected_keys) { %i[id name description active host_count emcee_email emcee_name emcee_id members] }
      let(:custom_attributes) do
        {
          host_count: 0,
          emcee_email: nil,
          emcee_name: nil,
          emcee_id: nil,
          members: []
        }
      end
    end
  end
end
