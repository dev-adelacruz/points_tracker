# frozen_string_literal: true

require "rails_helper"
require "./spec/support/shared_examples/blueprints/blueprint"

RSpec.describe HostBlueprint do
  describe "#render" do
    let(:record) { create(:user, :host) }

    it_behaves_like "a blueprint" do
      let(:expected_keys) { %i[id email] }
    end
  end
end
